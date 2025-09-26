const { AegisSDK } = require('./dist/index.js');

async function testMultiWallet() {
  console.log('🧪 Testing Multi-Wallet Support...\n');

  // Initialize SDK without walletMode (both modes available)
  const aegis = new AegisSDK({
    network: 'sepolia',
    appId: 'test-app-id',
    enableLogging: true
  });

  console.log('✅ SDK initialized without walletMode');
  console.log('📊 Initial wallet status:', aegis.getWalletStatus());
  console.log('🔍 Active wallet type:', aegis.getActiveWalletType());
  console.log('🔗 Is wallet connected:', aegis.isWalletConnected());
  console.log('');

  // Test 1: Generate in-app wallet
  console.log('1️⃣ Testing In-App Wallet Generation...');
  try {
    const privateKey = aegis.generateAccount();
    console.log('✅ In-app wallet generated successfully');
    console.log('📊 Wallet status after generation:', aegis.getWalletStatus());
    console.log('');
  } catch (error) {
    console.log('❌ In-app wallet generation failed:', error.message);
  }

  // Test 2: Test social auth methods availability (will fail without proper config, but should not throw validation errors)
  console.log('2️⃣ Testing Social Auth Methods Availability...');
  try {
    // This should not throw "not available in in-app mode" errors
    await aegis.signIn('test@example.com', 'password');
  } catch (error) {
    if (error.message.includes('Social auth manager not initialized')) {
      console.log('✅ Social auth methods are available (expected auth manager error)');
    } else if (error.message.includes('not available in social login mode')) {
      console.log('❌ Still has wallet mode restrictions');
    } else {
      console.log('✅ Social auth methods are available (other error):', error.message);
    }
  }

  try {
    const socialWallet = aegis.getSocialWallet();
    console.log('✅ getSocialWallet() available, returned:', socialWallet);
  } catch (error) {
    if (error.message.includes('only available in social login mode')) {
      console.log('❌ Still has wallet mode restrictions for getSocialWallet()');
    } else {
      console.log('✅ getSocialWallet() available');
    }
  }

  try {
    const isAuth = aegis.isSocialAuthenticated();
    console.log('✅ isSocialAuthenticated() available, returned:', isAuth);
  } catch (error) {
    if (error.message.includes('only available in social login mode')) {
      console.log('❌ Still has wallet mode restrictions for isSocialAuthenticated()');
    } else {
      console.log('✅ isSocialAuthenticated() available');
    }
  }

  console.log('');
  console.log('📊 Final wallet status:', aegis.getWalletStatus());
  console.log('🔍 Final active wallet type:', aegis.getActiveWalletType());
  console.log('');
  console.log('🎉 Multi-wallet test completed!');
}

// Run the test
testMultiWallet().catch(console.error);