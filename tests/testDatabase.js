const { executeQuery } = require('../src/config/database');

const testQuery = async() => {
    try {
        const result = await executeQuery('select * from users');
        console.log('Query results:', result);
    } catch (error) {
        console.error('Error executing test query:', error);
    }
};

testQuery();