/**
 * Script to fix trading packages duplicates and update indexes
 * This script will:
 * 1. Remove old unique indexes
 * 2. Mark duplicate packages as deleted (keeping the first one)
 * 3. Create new partial unique indexes
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.DATABASE_URL || 'mongodb://localhost:27017/neobot', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Get the trading packages collection
const getTradingPackagesCollection = () => {
  return mongoose.connection.db.collection('tradingpackages');
};

// Fix duplicate packages
const fixDuplicatePackages = async () => {
  const collection = getTradingPackagesCollection();
  
  console.log('🔍 Checking for duplicate packages...');
  
  // Find duplicates by name
  const nameDuplicates = await collection.aggregate([
    {
      $match: {
        is_deleted: { $ne: true }
      }
    },
    {
      $group: {
        _id: '$name',
        count: { $sum: 1 },
        docs: { $push: { id: '$_id', created_at: '$created_at' } }
      }
    },
    {
      $match: {
        count: { $gt: 1 }
      }
    }
  ]).toArray();
  
  console.log(`📋 Found ${nameDuplicates.length} duplicate name groups`);
  
  // Mark duplicates as deleted (keep the oldest one)
  for (const duplicate of nameDuplicates) {
    const sortedDocs = duplicate.docs.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    const toDelete = sortedDocs.slice(1); // Keep the first (oldest), delete the rest
    
    console.log(`🗑️  Marking ${toDelete.length} duplicate packages with name "${duplicate._id}" as deleted`);
    
    for (const doc of toDelete) {
      await collection.updateOne(
        { _id: doc.id },
        {
          $set: {
            is_deleted: true,
            deleted_at: new Date(),
            updated_at: new Date()
          }
        }
      );
    }
  }
  
  // Find duplicates by package_number
  const numberDuplicates = await collection.aggregate([
    {
      $match: {
        is_deleted: { $ne: true }
      }
    },
    {
      $group: {
        _id: '$package_number',
        count: { $sum: 1 },
        docs: { $push: { id: '$_id', created_at: '$created_at' } }
      }
    },
    {
      $match: {
        count: { $gt: 1 }
      }
    }
  ]).toArray();
  
  console.log(`📋 Found ${numberDuplicates.length} duplicate package number groups`);
  
  // Mark duplicates as deleted (keep the oldest one)
  for (const duplicate of numberDuplicates) {
    const sortedDocs = duplicate.docs.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    const toDelete = sortedDocs.slice(1); // Keep the first (oldest), delete the rest
    
    console.log(`🗑️  Marking ${toDelete.length} duplicate packages with number "${duplicate._id}" as deleted`);
    
    for (const doc of toDelete) {
      await collection.updateOne(
        { _id: doc.id },
        {
          $set: {
            is_deleted: true,
            deleted_at: new Date(),
            updated_at: new Date()
          }
        }
      );
    }
  }
};

// Update indexes
const updateIndexes = async () => {
  const collection = getTradingPackagesCollection();
  
  console.log('🔧 Updating database indexes...');
  
  try {
    // Drop old unique indexes if they exist
    try {
      await collection.dropIndex('name_1');
      console.log('✅ Dropped old name_1 index');
    } catch (error) {
      console.log('ℹ️  name_1 index not found (already dropped)');
    }
    
    try {
      await collection.dropIndex('package_number_1');
      console.log('✅ Dropped old package_number_1 index');
    } catch (error) {
      console.log('ℹ️  package_number_1 index not found (already dropped)');
    }
    
    // Create new partial unique indexes
    await collection.createIndex(
      { name: 1 },
      {
        unique: true,
        partialFilterExpression: {
          $or: [
            { is_deleted: { $exists: false } },
            { is_deleted: false }
          ]
        },
        name: 'name_active_unique'
      }
    );
    console.log('✅ Created name_active_unique index');

    await collection.createIndex(
      { package_number: 1 },
      {
        unique: true,
        partialFilterExpression: {
          $or: [
            { is_deleted: { $exists: false } },
            { is_deleted: false }
          ]
        },
        name: 'package_number_active_unique'
      }
    );
    console.log('✅ Created package_number_active_unique index');
    
    // Create other useful indexes
    await collection.createIndex({ status: 1, is_deleted: 1, sort_order: 1 });
    await collection.createIndex({ is_deleted: 1 });
    await collection.createIndex({ status: 1 });
    
    console.log('✅ Created additional indexes');
    
  } catch (error) {
    console.error('❌ Error updating indexes:', error);
  }
};

// Main function
const main = async () => {
  try {
    console.log('🚀 Starting trading packages duplicate fix...');
    
    await connectDB();
    await fixDuplicatePackages();
    await updateIndexes();
    
    console.log('✅ Trading packages duplicate fix completed successfully!');
    
    // Show final stats
    const collection = getTradingPackagesCollection();
    const totalPackages = await collection.countDocuments();
    const activePackages = await collection.countDocuments({ is_deleted: { $ne: true } });
    const deletedPackages = await collection.countDocuments({ is_deleted: true });
    
    console.log('\n📊 Final Statistics:');
    console.log(`   Total packages: ${totalPackages}`);
    console.log(`   Active packages: ${activePackages}`);
    console.log(`   Deleted packages: ${deletedPackages}`);
    
  } catch (error) {
    console.error('❌ Error during fix:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
};

// Run the script
if (require.main === module) {
  main();
}

module.exports = { main, fixDuplicatePackages, updateIndexes };
