/**
 * Test utility for statblock import functionality
 * Used for manual testing and verification of duplicate prevention
 *
 * @module utils/statblockImportTest
 */

import { useStatblockStore } from '../stores/statblocks';

/**
 * Create test statblock data
 */
export const createTestStatblock = (overrides = {}) => {
  return {
    name: 'Test Goblin',
    type: 'monster',
    size: 'Small',
    alignment: 'Neutral Evil',
    ac: 15,
    hp: 7,
    speed: { walk: 30 },
    scores: { str: 8, dex: 14, con: 10, int: 10, wis: 8, cha: 8 },
    challengeRating: '1/4',
    ...overrides
  };
};

/**
 * Test the import functionality with duplicates
 */
export const testDuplicatePrevention = async () => {
  const store = useStatblockStore.getState();
  console.log('🧪 Testing statblock duplicate prevention...');
  
  // Clean up any existing test data
  const existing = await store.findStatblockByName('Test Goblin');
  if (existing) {
    await store.deleteStatblock(existing.id);
    console.log('🧹 Cleaned up existing test data');
  }

  try {
    // Test 1: Create new statblock
    console.log('📝 Test 1: Creating new statblock...');
    const result1 = await store.importStatblock(createTestStatblock());
    console.log('✅ Result 1:', result1);
    
    // Verify it was created
    const statblock1 = await store.findStatblockByName('Test Goblin');
    if (!statblock1 || result1.action !== 'created') {
      throw new Error('❌ Failed to create new statblock');
    }
    console.log('✅ New statblock created successfully');

    // Test 2: Update existing statblock
    console.log('🔄 Test 2: Updating existing statblock...');
    const updatedData = createTestStatblock({ hp: 15, ac: 18 });
    const result2 = await store.importStatblock(updatedData);
    console.log('✅ Result 2:', result2);
    
    // Verify it was updated
    const statblock2 = await store.findStatblockByName('Test Goblin');
    if (!statblock2 || result2.action !== 'updated') {
      throw new Error('❌ Failed to update existing statblock');
    }
    
    if (statblock2.hp !== 15 || statblock2.ac !== 18) {
      throw new Error('❌ Statblock not updated with correct values');
    }
    
    if (statblock2.id !== statblock1.id) {
      throw new Error('❌ Statblock ID changed during update');
    }
    
    console.log('✅ Statblock updated successfully');
    console.log('✅ ID preserved:', statblock2.id);
    console.log('✅ Values updated:', { hp: statblock2.hp, ac: statblock2.ac });

    // Cleanup
    await store.deleteStatblock(statblock2.id);
    console.log('🧹 Test data cleaned up');
    
    console.log('🎉 All tests passed! Duplicate prevention is working correctly.');
    return true;
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
};

/**
 * Generate test JSON file for import testing
 */
export const generateTestJSON = (modified = false) => {
  const statblock = createTestStatblock(
    modified ? { hp: 20, ac: 25, name: 'Test Goblin Modified' } : {}
  );
  
  return JSON.stringify([statblock], null, 2);
};

/**
 * Run all statblock import tests
 */
export const runAllTests = async () => {
  console.log('🚀 Running statblock import tests...\n');
  
  const duplicateTest = await testDuplicatePrevention();
  
  console.log('\n📊 Test Summary:');
  console.log('Duplicate Prevention:', duplicateTest ? '✅ PASS' : '❌ FAIL');
  
  return duplicateTest;
};