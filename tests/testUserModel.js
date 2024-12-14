const UserModel = require('../src/models/userModel');

// Fungsi untuk test  
async function testValidateRefreshToken() {  
    try {  
        console.log('=== Mulai Test validateRefreshToken ===');  

        // Test case 1: Token yang valid  
        console.log('\nTest Case 1: Token Valid');  
        const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJyb3lhbmRpa28iLCJpYXQiOjE3MzM1OTAxNzksImV4cCI6MTczMzU5Mzc3OX0.0rB2KcorXs35ihXaTdbRjMxbUup_Sluscv2xAKWL6wM'; // Ganti dengan token yang ada di database  
        const result1 = await UserModel.validateRefreshToken(validToken);
        if (!result1) {
            console.log('kosong!!')
        }

        console.log('Hasil:', result1);  

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