// Mongodb (Advanced) Assignment

// Task 1: Schema Validation and Data Creation

// Step 1: Select the database for the advanced assignment.
use company_advanced
db

// Step 2: Create employees collection with schema validation
db.createCollection("employees", {
    validator: {
        $jsonSchema: {
            bsonType: "object",
            required: ["name", "departmentId", "experience", "active"],
            properties: {
                name: { bsonType: "string" },
                departmentId: { bsonType: "int" },
                experience: { bsonType: "int" },
                active: { bsonType: "bool" }
            }
        }
    }
})

// Step 3: Insert the starting employee dataset
db.employees.insertMany([
    {
        _id: 1,
        name: "John",
        departmentId: 10,
        skills: ["Java", "MongoDB"],
        experience: 4,
        active: true,
        certifications: [
            { name: "MongoDB", status: "Expired", expiryYear: 2026 }
        ]
    },
    {
        _id: 2,
        name: "Alice",
        departmentId: 10,
        skills: ["Python", "MongoDB"],
        experience: 6,
        active: true,
        certifications: [
            { name: "MongoDB", status: "Active", expiryYear: 2028 }
        ]
    },
    {
        _id: 3,
        name: "David",
        departmentId: 20,
        skills: ["Communication"],
        experience: 3,
        active: false,
        certifications: [
            { name: "Communication", status: "Active", expiryYear: 2027 }
        ]
    }
])

// Verify inserted employee data
db.employees.find()

// Step 4: Test schema validation with an invalid document
db.employees.insertOne({
    _id: 99,
    name: 123,
    departmentId: "HR",
    experience: "one",
    active: "yes"
})

// Verify valid employee count
db.employees.countDocuments()

// Verify invalid document was rejected
db.employees.find({ _id: 99 })

// ---------------------------------------------------------------------------------------------
// Task 2: Advanced Array Queries and Updates

// 2.1 Find employees with an active MongoDB certification
db.employees.find({
    certifications: {
        $elemMatch: {
            name: "MongoDB",
            status: "Active"
        }
    }
})

// 2.2 Update John's MongoDB certification status using positional $
db.employees.updateOne(
    { name: "John", "certifications.name": "MongoDB" },
    { $set: { "certifications.$.status": "Active" } }
)

// Verify John's certification status
db.employees.find({ name: "John" })

// 2.3 Update certifications expiring before 2027
db.employees.updateMany(
    {},
    { $set: { "certifications.$[cert].status": "Renewal Due" } },
    { arrayFilters: [{ "cert.expiryYear": { $lt: 2027 } }] }
)

// Verify final certification values
db.employees.find({ name: { $in: ["John", "Alice"] } })

// ---------------------------------------------------------------------------------------------
// Task 3: Bulk Write Operations

// Use one bulkWrite() call to complete all three operations:
// 1. Increase John's experience by 1.
// 2. Set Alice's active value to false.
// 3. Insert Emma using the document below.
db.employees.bulkWrite([
    {
        updateOne: {
            filter: { name: "John" },
            update: { $inc: { experience: 1 } }
        }
    },
    {
        updateOne: {
            filter: { name: "Alice" },
            update: { $set: { active: false } }
        }
    },
    {
        insertOne: {
            document: {
                _id: 4,
                name: "Emma",
                departmentId: 20,
                skills: ["Excel"],
                experience: 2,
                active: true,
                certifications: [
                    { name: "Excel", status: "Active", expiryYear: 2026 }
                ]
            }
        }
    }
])

// Verify John's experience
db.employees.find({ name: "John" })

// Verify Alice's active status
db.employees.find({ name: "Alice" })

// Verify added data
db.employees.find({ name: "Emma" })

// Verify total employee count
db.employees.countDocuments()

// ---------------------------------------------------------------------------------------------
// Task 4: Advanced Aggregation

// Insert department documents
db.departments.insertMany([
    { _id: 10, name: "Engineering" },
    { _id: 20, name: "HR" }
])

// Verify department documents
db.departments.find()

// 4.1 Join employees with departments

// Build an aggregation pipeline using $lookup and $unwind.
// - Join employees.departmentId with departments._id.
// - Return employee name and departmentName only.
// - Sort by employee name in ascending order.
db.employees.aggregate([
    {
        $lookup: {
            from: "departments",
            localField: "departmentId",
            foreignField: "_id",
            as: "department"
        }
    },
    {
        $unwind: "$department"
    },
    {
        $project: {
            _id: 0,
            name: 1,
            departmentName: "$department.name"
        }
    },
    {
        $sort: {
            name: 1
        }
    }
])

// 4.2 Unwind employee skills, count employees for each skill, and sort by count descending.
db.employees.aggregate([
    { $unwind: "$skills" },
    {
        $group: {
            _id: "$skills",
            count: { $sum: 1 }
        }
    },
    {
        $sort: {
            count: -1,
            _id: 1
        }
    }
])

// 4.3 Return active employee names and total count using $facet.
db.employees.aggregate([
    {
        $facet: {
            activeEmployees: [
                { $match: { active: true } },
                { $sort: { name: 1 } },
                { $project: { _id: 0, name: 1 } }
            ],
            totalActiveEmployees: [
                { $match: { active: true } },
                { $count: "count" }
            ]
        }
    }
])

// ---------------------------------------------------------------------------------------------
// Task 5: Indexing and Query Performance

// 5.1 Create a compound index on departmentId and name in ascending order.
db.employees.createIndex({ departmentId: 1, name: 1 })

// Verify the compound index
db.employees.getIndexes()

// 5.2 Check query performance and index usage using executionStats.
db.employees
    .find({ departmentId: 10 })
    .sort({ name: 1 })
    .explain("executionStats")

// 5.3 Create a TTL Index

// Create a session document with a 10-minute expiry time.
db.sessions.insertOne({
    _id: 1,
    userName: "John",
    expiresAt: new Date(Date.now() + 600000)
})

// Create a TTL index on expiresAt with immediate expiry.
db.sessions.createIndex(
    { expiresAt: 1 },
    { expireAfterSeconds: 0 }
)

// Verify the TTL index.
db.sessions.getIndexes()

// ---------------------------------------------------------------------------------------------
