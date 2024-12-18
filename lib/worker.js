import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';

globalThis.addEventListener('message', (e) => {
	console.log('Worker received message:', e.data);

	const wallet = Keypair.generate();
	console.log('publicKey:', wallet.publicKey.toBase58());

	globalThis.postMessage({
		message: wallet.publicKey.toBase58(),
	});
});
