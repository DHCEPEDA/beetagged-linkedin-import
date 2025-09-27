/**
 * BATCH DATABASE SERVICE
 * Efficient database operations for handling large contact imports
 * Replaces individual saves with optimized bulk operations
 */

/**
 * Batch Insert Contacts
 * Efficiently insert large arrays of contacts using MongoDB's insertMany
 */
async function batchInsertContacts(contacts, Contact, options = {}) {
  const batchSize = options.batchSize || 1000;
  const results = {
    inserted: 0,
    failed: 0,
    errors: [],
    duplicates: 0,
    totalProcessed: 0
  };
  
  console.log(`📦 Starting batch insert of ${contacts.length} contacts in batches of ${batchSize}`);
  
  // Process in batches to avoid memory issues
  for (let i = 0; i < contacts.length; i += batchSize) {
    const batch = contacts.slice(i, i + batchSize);
    console.log(`📦 Processing batch ${Math.floor(i / batchSize) + 1} (${batch.length} contacts)`);
    
    try {
      // Use insertMany with ordered: false to continue on errors
      const insertResult = await Contact.insertMany(batch, { 
        ordered: false,
        rawResult: true
      });
      
      results.inserted += insertResult.insertedCount || batch.length;
      results.totalProcessed += batch.length;
      
      console.log(`✅ Batch inserted: ${insertResult.insertedCount || batch.length} contacts`);
      
    } catch (error) {
      // Handle bulk write errors (usually duplicates)
      if (error.name === 'BulkWriteError' && error.result) {
        const inserted = error.result.nInserted || 0;
        const failed = batch.length - inserted;
        
        results.inserted += inserted;
        results.failed += failed;
        results.duplicates += failed; // Most failures are duplicates
        results.totalProcessed += batch.length;
        
        console.log(`⚠️  Batch partial success: ${inserted} inserted, ${failed} failed (likely duplicates)`);
        
        // Log first few errors for debugging
        if (error.writeErrors && error.writeErrors.length > 0) {
          const sampleErrors = error.writeErrors.slice(0, 3).map(err => ({
            code: err.code,
            message: err.errmsg,
            index: err.index
          }));
          results.errors.push(...sampleErrors);
        }
      } else {
        // Unexpected error
        console.error(`❌ Batch insert error:`, error.message);
        results.failed += batch.length;
        results.totalProcessed += batch.length;
        results.errors.push({
          batch: Math.floor(i / batchSize) + 1,
          error: error.message,
          contactCount: batch.length
        });
      }
    }
  }
  
  console.log(`🎯 Batch insert complete:`);
  console.log(`   ✅ Inserted: ${results.inserted}`);
  console.log(`   🔄 Duplicates: ${results.duplicates}`);
  console.log(`   ❌ Failed: ${results.failed}`);
  console.log(`   📊 Total: ${results.totalProcessed}`);
  
  return results;
}

/**
 * Batch Update Contacts
 * Efficiently update existing contacts using bulkWrite operations
 */
async function batchUpdateContacts(updates, Contact, options = {}) {
  const batchSize = options.batchSize || 500;
  const results = {
    updated: 0,
    failed: 0,
    errors: [],
    totalProcessed: 0
  };
  
  console.log(`🔄 Starting batch update of ${updates.length} contacts`);
  
  for (let i = 0; i < updates.length; i += batchSize) {
    const batch = updates.slice(i, i + batchSize);
    
    try {
      // Prepare bulk write operations
      const bulkOps = batch.map(update => ({
        updateOne: {
          filter: { _id: update._id },
          update: { $set: update.data, $inc: { __v: 1 } },
          upsert: false
        }
      }));
      
      const updateResult = await Contact.bulkWrite(bulkOps, { ordered: false });
      
      results.updated += updateResult.modifiedCount || 0;
      results.totalProcessed += batch.length;
      
      console.log(`✅ Batch updated: ${updateResult.modifiedCount} contacts`);
      
    } catch (error) {
      console.error(`❌ Batch update error:`, error.message);
      results.failed += batch.length;
      results.totalProcessed += batch.length;
      results.errors.push({
        batch: Math.floor(i / batchSize) + 1,
        error: error.message,
        updateCount: batch.length
      });
    }
  }
  
  return results;
}

/**
 * Find Existing Contacts by Email
 * Efficiently find existing contacts using $in operator for batch lookup
 */
async function findExistingContactsByEmail(emails, Contact) {
  if (!emails || emails.length === 0) return [];
  
  // Remove duplicates and empty emails
  const uniqueEmails = [...new Set(emails.filter(email => email && email.trim()))];
  
  if (uniqueEmails.length === 0) return [];
  
  console.log(`🔍 Looking up ${uniqueEmails.length} existing contacts by email`);
  
  try {
    const existingContacts = await Contact.find({
      email: { $in: uniqueEmails.map(email => email.toLowerCase().trim()) }
    }).lean();
    
    console.log(`📋 Found ${existingContacts.length} existing contacts`);
    return existingContacts;
    
  } catch (error) {
    console.error(`❌ Error finding existing contacts:`, error.message);
    return [];
  }
}

/**
 * Find Existing Contacts by Phone
 * Efficiently find existing contacts using normalized phone numbers
 */
async function findExistingContactsByPhone(phoneNumbers, Contact) {
  if (!phoneNumbers || phoneNumbers.length === 0) return [];
  
  // Normalize phone numbers (remove non-digits)
  const normalizedPhones = phoneNumbers
    .filter(phone => phone && phone.trim())
    .map(phone => phone.replace(/\D/g, ''))
    .filter(phone => phone.length >= 7); // Minimum phone length
  
  if (normalizedPhones.length === 0) return [];
  
  console.log(`📞 Looking up ${normalizedPhones.length} existing contacts by phone`);
  
  try {
    const existingContacts = await Contact.find({
      $or: [
        { phoneNumber: { $in: normalizedPhones } },
        { phone: { $in: normalizedPhones } },
        { phoneNumbers: { $in: normalizedPhones } }
      ]
    }).lean();
    
    console.log(`📋 Found ${existingContacts.length} existing contacts by phone`);
    return existingContacts;
    
  } catch (error) {
    console.error(`❌ Error finding existing contacts by phone:`, error.message);
    return [];
  }
}

/**
 * Batch Duplicate Detection
 * Efficiently detect duplicates by checking emails and phones in bulk
 */
async function batchFindDuplicates(contacts, Contact) {
  console.log(`🔍 Starting batch duplicate detection for ${contacts.length} contacts`);
  
  // Extract all emails and phones from contacts
  const emails = contacts.map(c => c.email).filter(Boolean);
  const phones = contacts.flatMap(c => [c.phone, ...(c.phoneNumbers || [])]).filter(Boolean);
  
  // Find existing contacts in parallel
  const [existingByEmail, existingByPhone] = await Promise.all([
    findExistingContactsByEmail(emails, Contact),
    findExistingContactsByPhone(phones, Contact)
  ]);
  
  // Create lookup maps for efficiency
  const emailMap = new Map();
  existingByEmail.forEach(contact => {
    if (contact.email) {
      emailMap.set(contact.email.toLowerCase().trim(), contact);
    }
  });
  
  const phoneMap = new Map();
  existingByPhone.forEach(contact => {
    // Map all phone variations
    if (contact.phone) {
      phoneMap.set(contact.phone.replace(/\D/g, ''), contact);
    }
    if (contact.phoneNumber) {
      phoneMap.set(contact.phoneNumber.replace(/\D/g, ''), contact);
    }
    if (contact.phoneNumbers) {
      contact.phoneNumbers.forEach(phone => {
        phoneMap.set(phone.replace(/\D/g, ''), contact);
      });
    }
  });
  
  // Categorize contacts
  const result = {
    newContacts: [],
    emailDuplicates: [],
    phoneDuplicates: [],
    potentialNameDuplicates: []
  };
  
  contacts.forEach(contact => {
    let isDuplicate = false;
    
    // Check email duplicates (exact match)
    if (contact.email) {
      const existing = emailMap.get(contact.email.toLowerCase().trim());
      if (existing) {
        result.emailDuplicates.push({
          newContact: contact,
          existingContact: existing,
          matchType: 'email'
        });
        isDuplicate = true;
      }
    }
    
    // Check phone duplicates (if no email match)
    if (!isDuplicate && contact.phone) {
      const normalizedPhone = contact.phone.replace(/\D/g, '');
      const existing = phoneMap.get(normalizedPhone);
      if (existing) {
        result.phoneDuplicates.push({
          newContact: contact,
          existingContact: existing,
          matchType: 'phone'
        });
        isDuplicate = true;
      }
    }
    
    // If no exact match, it's a new contact
    if (!isDuplicate) {
      result.newContacts.push(contact);
    }
  });
  
  console.log(`🎯 Duplicate detection complete:`);
  console.log(`   🆕 New contacts: ${result.newContacts.length}`);
  console.log(`   📧 Email duplicates: ${result.emailDuplicates.length}`);
  console.log(`   📞 Phone duplicates: ${result.phoneDuplicates.length}`);
  
  return result;
}

/**
 * Merge Contact Data
 * Intelligently merge duplicate contact data, prioritizing newer/more complete information
 */
function mergeContactData(existingContact, newContact) {
  const merged = { ...existingContact };
  
  // Merge strategy: prefer non-empty values from new contact
  const mergeFields = [
    'email', 'phone', 'company', 'position', 'jobTitle', 
    'location', 'profileUrl', 'linkedinId', 'notes'
  ];
  
  mergeFields.forEach(field => {
    if (newContact[field] && newContact[field].trim() && 
        (!merged[field] || merged[field].trim().length < newContact[field].trim().length)) {
      merged[field] = newContact[field];
    }
  });
  
  // Merge array fields
  const arrayFields = ['emails', 'phoneNumbers', 'companies', 'addresses', 'sites'];
  arrayFields.forEach(field => {
    if (newContact[field] && Array.isArray(newContact[field])) {
      const existing = merged[field] || [];
      merged[field] = [...new Set([...existing, ...newContact[field]])];
    }
  });
  
  // Update metadata
  merged.updatedAt = new Date();
  if (newContact.source && !merged.source) {
    merged.source = newContact.source;
  }
  
  return merged;
}

module.exports = {
  batchInsertContacts,
  batchUpdateContacts,
  findExistingContactsByEmail,
  findExistingContactsByPhone,
  batchFindDuplicates,
  mergeContactData
};