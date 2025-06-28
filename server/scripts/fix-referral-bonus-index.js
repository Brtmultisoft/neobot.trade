// Migration script to fix referral bonus unique index in the incomes collection
// Run this script with: node server/scripts/fix-referral-bonus-index.js

const mongoose = require('mongoose');

const MONGO_URI ="mongodb+srv://dev2brtmultisoftware:IeXTDVed9mEsjLC1@cluster0.7irwj2u.mongodb.net/neobot?retryWrites=true&w=majority&appName=Cluster0"

async function fixReferralBonusIndex() {
    try {
        await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
        const db = mongoose.connection.db;
        const collection = db.collection('incomes');

        // 1. Remove any wrong unique index on {user_id, type}
        const indexes = await collection.indexes();
        for (const idx of indexes) {
            if (
                idx.unique &&
                idx.key &&
                Object.keys(idx.key).length === 2 &&
                idx.key.user_id === 1 &&
                idx.key.type === 1
            ) {
                console.log('Dropping incorrect unique index:', idx.name);
                await collection.dropIndex(idx.name);
            }
        }

        // 2. Add correct unique index on {user_id, user_id_from, type} for referral_bonus only
        const correctIndex = indexes.find(
            idx => idx.key && idx.key.user_id === 1 && idx.key.user_id_from === 1 && idx.key.type === 1 && idx.unique
        );
        if (!correctIndex) {
            console.log('Creating correct unique index on {user_id, user_id_from, type} for referral_bonus...');
            await collection.createIndex(
                { user_id: 1, user_id_from: 1, type: 1 },
                { unique: true, partialFilterExpression: { type: 'referral_bonus' }, name: 'unique_referral_bonus_per_pair' }
            );
            console.log('Correct unique index created.');
        } else {
            console.log('Correct unique index already exists.');
        }

        await mongoose.disconnect();
        console.log('Migration completed successfully.');
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

fixReferralBonusIndex(); 