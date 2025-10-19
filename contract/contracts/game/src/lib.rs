#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, String};

// Define the maximum value for stats
const MAX_STAT: u32 = 100;

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Pet {
    pub owner: Address,
    pub name: String,
    pub birthdate: u64,
    pub last_updated: u64,
    pub is_alive: bool,

    // Stats
    pub hunger: u32,
    pub happiness: u32,
    pub energy: u32,

    // Customization
    pub has_glasses: bool,
}

#[contracttype]
pub enum DataKey {
    Pet(Address),
    Coins(Address),
}

#[contract]
pub struct TamagotchiContract;

#[contractimpl]
impl TamagotchiContract {
    pub fn create(env: Env, owner: Address, name: String) -> Pet {
        owner.require_auth();

        let pet_key = DataKey::Pet(owner.clone());

        // Check if pet already exists and update its status with decay logic
        if env.storage().instance().has(&pet_key) {
            // Call get_pet to force the decay logic to run and update storage
            let updated_pet = Self::get_pet(env.clone(), owner.clone());

            // Check the updated status after decay
            if updated_pet.is_alive {
                panic!("Pet already exists for this owner");
            }
        }

        let current_time = env.ledger().timestamp();

        let pet = Pet {
            owner: owner.clone(),
            name: name.clone(),
            birthdate: current_time,
            last_updated: current_time,
            is_alive: true,
            hunger: MAX_STAT,
            happiness: MAX_STAT,
            energy: MAX_STAT,
            has_glasses: false,
        };

        // This will overwrite the old pet data if it exists
        env.storage()
            .instance()
            .set(&DataKey::Pet(owner.clone()), &pet);

        // Initialize coins for new pet (reset to 0 if recreating)
        env.storage().instance().set(&DataKey::Coins(owner), &0i128);

        pet
    }

    pub fn feed(env: Env, owner: Address) {
        owner.require_auth();
        let mut pet = Self::get_pet(env.clone(), owner.clone());
        if !pet.is_alive {
            panic!("Your pet is no longer with us.");
        }

        // Apply action
        pet.hunger = (pet.hunger + 30).min(MAX_STAT);

        // Update state
        pet.last_updated = env.ledger().timestamp();
        env.storage().instance().set(&DataKey::Pet(owner), &pet);
    }

    pub fn play(env: Env, owner: Address) {
        owner.require_auth();
        let mut pet = Self::get_pet(env.clone(), owner.clone());
        if !pet.is_alive {
            panic!("Your pet is no longer with us.");
        }

        // Apply action
        pet.happiness = (pet.happiness + 20).min(MAX_STAT);
        pet.energy = pet.energy.saturating_sub(15);

        // Update state
        pet.last_updated = env.ledger().timestamp();
        env.storage().instance().set(&DataKey::Pet(owner), &pet);
    }

    pub fn sleep(env: Env, owner: Address) {
        owner.require_auth();
        let mut pet = Self::get_pet(env.clone(), owner.clone());
        if !pet.is_alive {
            panic!("Your pet is no longer with us.");
        }

        // Apply action
        pet.energy = (pet.energy + 40).min(MAX_STAT);

        // Update state
        pet.last_updated = env.ledger().timestamp();
        env.storage().instance().set(&DataKey::Pet(owner), &pet);
    }

    pub fn work(env: Env, owner: Address) {
        owner.require_auth();
        let mut pet = Self::get_pet(env.clone(), owner.clone());
        if !pet.is_alive {
            panic!("Your pet is no longer with us.");
        }

        if pet.energy < 20 {
            panic!("Not enough energy to work.");
        }

        // Apply action
        pet.energy = pet.energy.saturating_sub(20);
        pet.happiness = pet.happiness.saturating_sub(10);

        // Grant coins
        let mut coins: i128 = env
            .storage()
            .instance()
            .get(&DataKey::Coins(owner.clone()))
            .unwrap_or(0);
        coins += 25;

        // Update state
        pet.last_updated = env.ledger().timestamp();
        env.storage()
            .instance()
            .set(&DataKey::Pet(owner.clone()), &pet);
        env.storage().instance().set(&DataKey::Coins(owner), &coins);
    }

    pub fn mint_glasses(env: Env, owner: Address) {
        owner.require_auth();
        let mut pet = Self::get_pet(env.clone(), owner.clone());
        if !pet.is_alive {
            panic!("Your pet is no longer with us.");
        }

        let mut coins: i128 = env
            .storage()
            .instance()
            .get(&DataKey::Coins(owner.clone()))
            .unwrap_or(0);
        if coins < 50 {
            panic!("Not enough coins to mint glasses.");
        }
        coins -= 50;

        pet.has_glasses = true;

        pet.last_updated = env.ledger().timestamp();
        env.storage()
            .instance()
            .set(&DataKey::Pet(owner.clone()), &pet);
        env.storage().instance().set(&DataKey::Coins(owner), &coins);
    }

    pub fn get_pet(env: Env, owner: Address) -> Pet {
        let mut pet: Pet = env
            .storage()
            .instance()
            .get(&DataKey::Pet(owner.clone()))
            .expect("Pet not found");

        if !pet.is_alive {
            return pet;
        }

        let current_time = env.ledger().timestamp();
        let time_elapsed = current_time.saturating_sub(pet.last_updated);

        // Stats decay every hour (3600 seconds) for 7-day lifespan
        let decay_periods = time_elapsed / 3600;

        if decay_periods > 0 {
            // Hunger decays by 1 point per hour (dies in ~4 days if not fed)
            pet.hunger = pet.hunger.saturating_sub(decay_periods as u32);
            // Happiness decays by 1 point per 2 hours (dies in ~8 days if not played with)
            pet.happiness = pet.happiness.saturating_sub((decay_periods as u32) / 2);

            pet.last_updated = current_time;

            // Check if pet should die
            if pet.hunger == 0 || pet.happiness == 0 {
                pet.is_alive = false;
            }

            // Always update storage after any changes
            env.storage().instance().set(&DataKey::Pet(owner), &pet);
        }

        pet
    }

    pub fn get_coins(env: Env, owner: Address) -> i128 {
        env.storage()
            .instance()
            .get(&DataKey::Coins(owner))
            .unwrap_or(0)
    }

    // Check pet status and force cleanup
    pub fn debug_pet_status(env: Env, owner: Address) -> (bool, bool, u32, u32) {
        let pet_exists = env.storage().instance().has(&DataKey::Pet(owner.clone()));

        if !pet_exists {
            return (false, false, 0, 0);
        }

        let pet = Self::get_pet(env.clone(), owner.clone());
        (pet_exists, pet.is_alive, pet.hunger, pet.happiness)
    }

    // Method to remove any pet (alive or dead)
    pub fn remove_pet(env: Env, owner: Address) {
        owner.require_auth();

        let pet_key = DataKey::Pet(owner.clone());
        let coins_key = DataKey::Coins(owner.clone());

        // Remove pet data if it exists
        if env.storage().instance().has(&pet_key) {
            env.storage().instance().remove(&pet_key);
        }

        // Remove coins data if it exists
        if env.storage().instance().has(&coins_key) {
            env.storage().instance().remove(&coins_key);
        }
    }
}

#[cfg(test)]
mod test;
