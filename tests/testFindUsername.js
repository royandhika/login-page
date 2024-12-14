const UserModel = require('../src/models/userModel');

// Fungsi untuk test  
async function testValidateRefreshToken() {  
    try {  
        console.log('=== Mulai Test validateRefreshToken ===');  

        // Test case 1: Token yang valid  
        console.log('\nTest Case 1: Username ada');  
        const user = 'testuser6'; // Ganti dengan token yang ada di database  
        const username = await UserModel.findByUsername(user);
        if (!username) {
            console.log('kosong!!')
        }

        console.log('Hasil:', username);  

        // Test case 2: Token yang tidak ada  
        console.log('\nTest Case 2: Token Invalid');  
        const invalidToken = 'token_yang_tidak_ada';  
        const result2 = await UserModel.validateRefreshToken(invalidToken);  
        console.log('Hasil:', result2);  

        console.log('\n=== Test Selesai ===');  
    } catch (error) {  
        console.error('Error saat testing:', error);  
    }  
}  

// Jalankan test  
testValidateRefreshToken();  