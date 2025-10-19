#![cfg(test)]

use super::{TamagotchiContract, TamagotchiContractClient, MAX_STAT};
use soroban_sdk::{
    testutils::{Address as _, Ledger, LedgerInfo},
    Address, Env, String,
};

fn create_tamagotchi_contract(env: &Env) -> TamagotchiContractClient<'_> {
    TamagotchiContractClient::new(env, &env.register(TamagotchiContract, ()))
}

fn advance_ledger(env: &Env, seconds: u64) {
    env.ledger().set(LedgerInfo {
        timestamp: env.ledger().timestamp() + seconds,
        protocol_version: env.ledger().protocol_version(),
        sequence_number: env.ledger().sequence(),
        network_id: Default::default(),
        base_reserve: 10,
        min_temp_entry_ttl: 1,
        min_persistent_entry_ttl: 1,
        max_entry_ttl: u32::MAX,
    });
}

#[test]
fn test_create_pet() {
    let env = Env::default();
    env.mock_all_auths();
    let client = create_tamagotchi_contract(&env);
    let owner = Address::generate(&env);
    let name = String::from_str(&env, "Pixel");

    let pet = client.create(&owner, &name);

    assert_eq!(pet.owner, owner);
    assert_eq!(pet.name, name);
    assert_eq!(pet.is_alive, true);
    assert_eq!(pet.hunger, MAX_STAT);
    assert_eq!(pet.happiness, MAX_STAT);
    assert_eq!(pet.energy, MAX_STAT);
    assert_eq!(pet.has_glasses, false);

    let coins = client.get_coins(&owner);
    assert_eq!(coins, 0);
}

#[test]
#[should_panic(expected = "Pet already exists for this owner")]
fn test_create_pet_already_exists() {
    let env = Env::default();
    env.mock_all_auths();
    let client = create_tamagotchi_contract(&env);
    let owner = Address::generate(&env);
    let name = String::from_str(&env, "Pixel");

    client.create(&owner, &name);
    client.create(&owner, &name); // Should panic here
}

#[test]
fn test_feed() {
    let env = Env::default();
    env.mock_all_auths();
    let client = create_tamagotchi_contract(&env);
    let owner = Address::generate(&env);

    client.create(&owner, &String::from_str(&env, "Giga"));

    // Let's simulate decay first - 5 hours
    advance_ledger(&env, 3600 * 5);
    client.feed(&owner);
    let pet = client.get_pet(&owner);

    // Initial: 100. Decay over 5 hours: 100 - 5 = 95.
    assert_eq!(pet.hunger, MAX_STAT);
}

#[test]
fn test_play() {
    let env = Env::default();
    env.mock_all_auths();
    let client = create_tamagotchi_contract(&env);
    let owner = Address::generate(&env);
    client.create(&owner, &String::from_str(&env, "Player"));

    advance_ledger(&env, 3600 * 10); // 10 hours
                                     // Initial happiness: 100. Decay: 100 - (10/2) = 95.
                                     // Initial energy: 100. No decay for energy.

    client.play(&owner);
    let pet = client.get_pet(&owner);

    // Happiness: 95 + 20 = 115, capped at 100.
    // Energy: 100 - 15 = 85.
    assert_eq!(pet.happiness, MAX_STAT);
    assert_eq!(pet.energy, 85);
}

#[test]
fn test_work() {
    let env = Env::default();
    env.mock_all_auths();
    let client = create_tamagotchi_contract(&env);
    let owner = Address::generate(&env);
    client.create(&owner, &String::from_str(&env, "Worker"));

    client.work(&owner);
    let pet = client.get_pet(&owner);
    let coins = client.get_coins(&owner);

    // Energy: 100 - 20 = 80
    // Happiness: 100 - 10 = 90
    // Coins: 0 + 25 = 25
    assert_eq!(pet.energy, 80);
    assert_eq!(pet.happiness, 90);
    assert_eq!(coins, 25);
}

#[test]
#[should_panic(expected = "Not enough energy to work.")]
fn test_work_no_energy() {
    let env = Env::default();
    env.mock_all_auths();
    let client = create_tamagotchi_contract(&env);
    let owner = Address::generate(&env);
    client.create(&owner, &String::from_str(&env, "Tired"));

    // Work 5 times to drain energy
    for _ in 0..5 {
        client.work(&owner);
    }
    // Energy should be 0 now.
    let pet = client.get_pet(&owner);
    assert_eq!(pet.energy, 0);

    client.work(&owner); // Should panic
}

#[test]
fn test_sleep() {
    let env = Env::default();
    env.mock_all_auths();
    let client = create_tamagotchi_contract(&env);
    let owner = Address::generate(&env);
    client.create(&owner, &String::from_str(&env, "Sleepy"));

    // Work to reduce energy
    client.work(&owner); // Energy: 80
    client.work(&owner); // Energy: 60

    client.sleep(&owner);
    let pet = client.get_pet(&owner);
    // Energy: 60 + 40 = 100
    assert_eq!(pet.energy, MAX_STAT);
}

#[test]
fn test_stat_decay_and_death() {
    let env = Env::default();
    env.mock_all_auths();
    let client = create_tamagotchi_contract(&env);
    let owner = Address::generate(&env);
    client.create(&owner, &String::from_str(&env, "Doomed"));

    // Hunger decays by 1 every hour. It needs 100 hours to reach 0.
    advance_ledger(&env, 360000);

    // Calling any function will trigger the decay calculation.
    let pet = client.get_pet(&owner);
    assert_eq!(pet.is_alive, false);
    assert_eq!(pet.hunger, 0);
}

#[test]
#[should_panic(expected = "Your pet is no longer with us.")]
fn test_action_on_dead_pet() {
    let env = Env::default();
    env.mock_all_auths();
    let client = create_tamagotchi_contract(&env);
    let owner = Address::generate(&env);
    client.create(&owner, &String::from_str(&env, "Ghost"));

    // Advance time enough to kill the pet (100 hours for hunger)
    advance_ledger(&env, 360000);

    // This call will update the state to dead
    let pet = client.get_pet(&owner);
    assert_eq!(pet.is_alive, false);

    // This should panic
    client.feed(&owner);
}

#[test]
fn test_mint_glasses() {
    let env = Env::default();
    env.mock_all_auths();
    let client = create_tamagotchi_contract(&env);
    let owner = Address::generate(&env);
    client.create(&owner, &String::from_str(&env, "Cool"));

    // Work to earn coins (need at least 50 for glasses)
    client.work(&owner); // 25 coins
    client.work(&owner); // 50 coins

    client.mint_glasses(&owner);

    let pet = client.get_pet(&owner);
    let coins = client.get_coins(&owner);

    assert_eq!(pet.has_glasses, true);
    assert_eq!(coins, 0);
}

#[test]
fn test_recreate_pet_after_death() {
    let env = Env::default();
    env.mock_all_auths();
    let client = create_tamagotchi_contract(&env);
    let owner = Address::generate(&env);

    // Create initial pet
    client.create(&owner, &String::from_str(&env, "FirstPet"));

    let pet = client.get_pet(&owner);
    assert_eq!(pet.is_alive, true);
    assert_eq!(pet.name, String::from_str(&env, "FirstPet"));

    // Advance time to kill the pet (hunger decays by 1 every hour, needs 100 hours to reach 0)
    advance_ledger(&env, 360000); // 100 hours

    // Verify pet is dead by calling get_pet (this triggers decay calculation)
    let dead_pet = client.get_pet(&owner);
    assert_eq!(dead_pet.is_alive, false);
    assert_eq!(dead_pet.hunger, 0);

    // Now create a new pet
    let new_pet = client.create(&owner, &String::from_str(&env, "SecondPet"));

    // Verify new pet is alive and has correct stats
    assert_eq!(new_pet.is_alive, true);
    assert_eq!(new_pet.name, String::from_str(&env, "SecondPet"));
    assert_eq!(new_pet.hunger, MAX_STAT);
    assert_eq!(new_pet.happiness, MAX_STAT);
    assert_eq!(new_pet.energy, MAX_STAT);
    assert_eq!(new_pet.has_glasses, false);

    // Verify coins are reset to 0 for new pet
    let coins = client.get_coins(&owner);
    assert_eq!(coins, 0);
}

#[test]
#[should_panic(expected = "Not enough coins to mint glasses.")]
fn test_mint_glasses_no_coins() {
    let env = Env::default();
    env.mock_all_auths();
    let client = create_tamagotchi_contract(&env);
    let owner = Address::generate(&env);
    client.create(&owner, &String::from_str(&env, "Broke"));

    // Try to mint glasses without earning any coins
    client.mint_glasses(&owner); // Should panic
}

/* -------------------------------------------------------------------------- */
/*                        COMPREHENSIVE NEGATIVE TESTS                        */
/* -------------------------------------------------------------------------- */

#[test]
#[should_panic(expected = "Pet not found")]
fn test_get_nonexistent_pet() {
    let env = Env::default();
    env.mock_all_auths();
    let client = create_tamagotchi_contract(&env);
    let owner = Address::generate(&env);

    client.get_pet(&owner); // Should panic
}

#[test]
fn test_get_coins_nonexistent_user() {
    let env = Env::default();
    env.mock_all_auths();
    let client = create_tamagotchi_contract(&env);
    let owner = Address::generate(&env);

    let coins = client.get_coins(&owner);
    assert_eq!(coins, 0); // Should return 0, not panic
}

#[test]
#[should_panic(expected = "Pet not found")]
fn test_feed_nonexistent_pet() {
    let env = Env::default();
    env.mock_all_auths();
    let client = create_tamagotchi_contract(&env);
    let owner = Address::generate(&env);

    client.feed(&owner); // Should panic
}

#[test]
#[should_panic(expected = "Pet not found")]
fn test_play_nonexistent_pet() {
    let env = Env::default();
    env.mock_all_auths();
    let client = create_tamagotchi_contract(&env);
    let owner = Address::generate(&env);

    client.play(&owner); // Should panic
}

#[test]
#[should_panic(expected = "Pet not found")]
fn test_sleep_nonexistent_pet() {
    let env = Env::default();
    env.mock_all_auths();
    let client = create_tamagotchi_contract(&env);
    let owner = Address::generate(&env);

    client.sleep(&owner); // Should panic
}

#[test]
#[should_panic(expected = "Pet not found")]
fn test_work_nonexistent_pet() {
    let env = Env::default();
    env.mock_all_auths();
    let client = create_tamagotchi_contract(&env);
    let owner = Address::generate(&env);

    client.work(&owner); // Should panic
}

#[test]
#[should_panic(expected = "Pet not found")]
fn test_mint_glasses_nonexistent_pet() {
    let env = Env::default();
    env.mock_all_auths();
    let client = create_tamagotchi_contract(&env);
    let owner = Address::generate(&env);

    client.mint_glasses(&owner); // Should panic
}

#[test]
#[should_panic(expected = "Your pet is no longer with us.")]
fn test_play_dead_pet() {
    let env = Env::default();
    env.mock_all_auths();
    let client = create_tamagotchi_contract(&env);
    let owner = Address::generate(&env);

    client.create(&owner, &String::from_str(&env, "DeadPet"));
    advance_ledger(&env, 360000); // Kill pet
    client.get_pet(&owner); // Update death status
    client.play(&owner); // Should panic
}

#[test]
#[should_panic(expected = "Your pet is no longer with us.")]
fn test_sleep_dead_pet() {
    let env = Env::default();
    env.mock_all_auths();
    let client = create_tamagotchi_contract(&env);
    let owner = Address::generate(&env);

    client.create(&owner, &String::from_str(&env, "DeadPet"));
    advance_ledger(&env, 360000); // Kill pet
    client.get_pet(&owner); // Update death status
    client.sleep(&owner); // Should panic
}

#[test]
#[should_panic(expected = "Your pet is no longer with us.")]
fn test_work_dead_pet() {
    let env = Env::default();
    env.mock_all_auths();
    let client = create_tamagotchi_contract(&env);
    let owner = Address::generate(&env);

    client.create(&owner, &String::from_str(&env, "DeadPet"));
    advance_ledger(&env, 360000); // Kill pet
    client.get_pet(&owner); // Update death status
    client.work(&owner); // Should panic
}

#[test]
#[should_panic(expected = "Your pet is no longer with us.")]
fn test_mint_glasses_dead_pet() {
    let env = Env::default();
    env.mock_all_auths();
    let client = create_tamagotchi_contract(&env);
    let owner = Address::generate(&env);

    client.create(&owner, &String::from_str(&env, "DeadPet"));
    advance_ledger(&env, 360000); // Kill pet
    client.get_pet(&owner); // Update death status
    client.mint_glasses(&owner); // Should panic
}

#[test]
#[should_panic(expected = "Not enough energy to work.")]
fn test_work_insufficient_energy_edge_case() {
    let env = Env::default();
    env.mock_all_auths();
    let client = create_tamagotchi_contract(&env);
    let owner = Address::generate(&env);

    client.create(&owner, &String::from_str(&env, "Exhausted"));

    // Drain energy to exactly 19 (below threshold of 20)
    for _ in 0..4 {
        client.work(&owner); // 100 -> 80 -> 60 -> 40 -> 20
    }

    let pet = client.get_pet(&owner);
    assert_eq!(pet.energy, 20);

    // One more work should succeed
    client.work(&owner); // 20 -> 0

    let pet = client.get_pet(&owner);
    assert_eq!(pet.energy, 0);

    // This should panic
    client.work(&owner);
}

/* -------------------------------------------------------------------------- */
/*                    PRODUCTION-READY COMPREHENSIVE TESTS                    */
/* -------------------------------------------------------------------------- */

#[test]
fn test_multiple_users_isolation() {
    let env = Env::default();
    env.mock_all_auths();
    let client = create_tamagotchi_contract(&env);

    let user1 = Address::generate(&env);
    let user2 = Address::generate(&env);
    let user3 = Address::generate(&env);

    // Create pets for different users
    client.create(&user1, &String::from_str(&env, "Pet1"));
    client.create(&user2, &String::from_str(&env, "Pet2"));
    client.create(&user3, &String::from_str(&env, "Pet3"));

    // User1 works, user2 plays, user3 feeds
    client.work(&user1);
    client.play(&user2);
    client.feed(&user3);

    // Check isolation
    let pet1 = client.get_pet(&user1);
    let pet2 = client.get_pet(&user2);
    let pet3 = client.get_pet(&user3);

    // User1 should have less energy and happiness, more coins
    assert_eq!(pet1.energy, 80);
    assert_eq!(pet1.happiness, 90);
    assert_eq!(client.get_coins(&user1), 25);

    // User2 should have max happiness, less energy
    assert_eq!(pet2.happiness, MAX_STAT);
    assert_eq!(pet2.energy, 85);
    assert_eq!(client.get_coins(&user2), 0);

    // User3 should have max hunger
    assert_eq!(pet3.hunger, MAX_STAT);
    assert_eq!(client.get_coins(&user3), 0);
}

#[test]
fn test_stat_boundaries() {
    let env = Env::default();
    env.mock_all_auths();
    let client = create_tamagotchi_contract(&env);
    let owner = Address::generate(&env);

    client.create(&owner, &String::from_str(&env, "Boundary"));

    // Test feeding when already at max
    client.feed(&owner);
    let pet = client.get_pet(&owner);
    assert_eq!(pet.hunger, MAX_STAT); // Should stay at 100

    // Test playing when already at max happiness
    client.play(&owner);
    let pet = client.get_pet(&owner);
    assert_eq!(pet.happiness, MAX_STAT); // Should stay at 100

    // Test sleeping when already at max energy
    client.sleep(&owner);
    let pet = client.get_pet(&owner);
    assert_eq!(pet.energy, MAX_STAT); // Should stay at 100

    // Drain energy completely
    for _ in 0..5 {
        client.work(&owner);
    }
    let pet = client.get_pet(&owner);
    assert_eq!(pet.energy, 0);
}

#[test]
fn test_time_progression_accuracy() {
    let env = Env::default();
    env.mock_all_auths();
    let client = create_tamagotchi_contract(&env);
    let owner = Address::generate(&env);

    client.create(&owner, &String::from_str(&env, "TimeTest"));

    // Test 1-hour progression
    advance_ledger(&env, 3600); // 1 hour
    let pet = client.get_pet(&owner);
    assert_eq!(pet.hunger, 99); // 100 - 1
    assert_eq!(pet.happiness, 100); // 100 - 0 (decay every 2 hours)

    // Test 2-hour progression (total 3 hours)
    advance_ledger(&env, 3600 * 2); // 2 more hours
    let pet = client.get_pet(&owner);
    assert_eq!(pet.hunger, 97); // 100 - 3
    assert_eq!(pet.happiness, 99); // 100 - 1 (3/2 = 1)

    // Test 24-hour progression (total 27 hours)
    advance_ledger(&env, 3600 * 24); // 24 more hours
    let pet = client.get_pet(&owner);
    assert_eq!(pet.hunger, 73); // 100 - 27
    assert_eq!(pet.happiness, 87); // 100 - 13 (27/2 = 13)
}

#[test]
fn test_death_by_happiness() {
    let env = Env::default();
    env.mock_all_auths();
    let client = create_tamagotchi_contract(&env);
    let owner = Address::generate(&env);

    client.create(&owner, &String::from_str(&env, "Sad"));

    // Feed regularly to keep hunger up, but don't play
    for _i in 0..50 {
        advance_ledger(&env, 3600 * 4); // 4 hours

        // Check if pet is dead first
        let pet = client.get_pet(&owner);
        if !pet.is_alive {
            // Should die from happiness, not hunger
            assert!(pet.happiness == 0);
            assert!(pet.hunger > 0);
            return;
        }

        // Only feed if pet is still alive
        client.feed(&owner); // Keep hunger high
    }
    panic!("Pet should have died from low happiness");
}

#[test]
fn test_complex_action_sequence() {
    let env = Env::default();
    env.mock_all_auths();
    let client = create_tamagotchi_contract(&env);
    let owner = Address::generate(&env);

    client.create(&owner, &String::from_str(&env, "Complex"));

    // Simulate a balanced daily routine for a week
    for day in 1..=7 {
        // Morning: feed and play
        client.feed(&owner);
        client.play(&owner);

        // Afternoon: work once (not twice to avoid energy drain)
        client.work(&owner);

        // Evening: sleep to recover
        client.sleep(&owner);

        // Let 8 hours pass (less aggressive time progression)
        advance_ledger(&env, 3600 * 8);

        let pet = client.get_pet(&owner);
        assert!(pet.is_alive, "Pet died on day {}", day);

        // More reasonable stat ranges after balanced activities
        assert!(
            pet.hunger >= 30,
            "Hunger too low on day {}: {}",
            day,
            pet.hunger
        );
        assert!(
            pet.happiness >= 30,
            "Happiness too low on day {}: {}",
            day,
            pet.happiness
        );
        assert!(
            pet.energy >= 30,
            "Energy too low on day {}: {}",
            day,
            pet.energy
        );
    }

    // After a week, pet should still be alive and user should have coins
    let coins = client.get_coins(&owner);
    assert!(
        coins >= 7 * 25,
        "Should have earned at least {} coins, got {}",
        7 * 25,
        coins
    );
}

#[test]
fn test_glasses_workflow() {
    let env = Env::default();
    env.mock_all_auths();
    let client = create_tamagotchi_contract(&env);
    let owner = Address::generate(&env);

    client.create(&owner, &String::from_str(&env, "Stylish"));

    // Work exactly enough for glasses
    client.work(&owner); // 25 coins
    client.work(&owner); // 50 coins

    let coins_before = client.get_coins(&owner);
    assert_eq!(coins_before, 50);

    let pet_before = client.get_pet(&owner);
    assert_eq!(pet_before.has_glasses, false);

    // Buy glasses
    client.mint_glasses(&owner);

    let coins_after = client.get_coins(&owner);
    let pet_after = client.get_pet(&owner);

    assert_eq!(coins_after, 0);
    assert_eq!(pet_after.has_glasses, true);
}

#[test]
fn test_edge_case_zero_time_elapsed() {
    let env = Env::default();
    env.mock_all_auths();
    let client = create_tamagotchi_contract(&env);
    let owner = Address::generate(&env);

    client.create(&owner, &String::from_str(&env, "Instant"));

    // Get pet immediately without time advancement
    let pet1 = client.get_pet(&owner);
    let pet2 = client.get_pet(&owner);

    // Stats should be identical
    assert_eq!(pet1.hunger, pet2.hunger);
    assert_eq!(pet1.happiness, pet2.happiness);
    assert_eq!(pet1.energy, pet2.energy);
    assert_eq!(pet1.is_alive, pet2.is_alive);
}

#[test]
fn test_maximum_stat_decay() {
    let env = Env::default();
    env.mock_all_auths();
    let client = create_tamagotchi_contract(&env);
    let owner = Address::generate(&env);

    client.create(&owner, &String::from_str(&env, "Maximum"));

    // Test hunger reaching exactly 0
    advance_ledger(&env, 3600 * 100); // 100 hours
    let pet = client.get_pet(&owner);
    assert_eq!(pet.hunger, 0);
    assert_eq!(pet.is_alive, false);

    // Test happiness reaching exactly 0
    let owner2 = Address::generate(&env);
    client.create(&owner2, &String::from_str(&env, "Maximum2"));
    advance_ledger(&env, 3600 * 200); // 200 hours (happiness decays every 2 hours)
    let pet2 = client.get_pet(&owner2);
    assert_eq!(pet2.happiness, 0);
    assert_eq!(pet2.is_alive, false);
}
