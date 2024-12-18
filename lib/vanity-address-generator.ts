import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';

export enum variryAddressGeneratorMode {
	PREFIX = 'prefix',
	SUFFIX = 'suffix',
}

type VaniryAddressGeneratorOptions = {
	caseSensitive?: boolean;
	mode?: variryAddressGeneratorMode;
};

type GenerateResult = {
	publicKey: string;
	privateKey: string;
	attempts: number;
	timeSpent: number;
};

type GenerateProgress = {
	attempts: number;
	timeSpent: number;
	estimatedProgress: number;
};

const BASE58_CHARS =
	'123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

export class VaniryAddressGenerator {
	config: Required<VaniryAddressGeneratorOptions>;

	isRunning = false;

	constructor({ caseSensitive, mode }: VaniryAddressGeneratorOptions = {}) {
		this.config = {
			caseSensitive: caseSensitive ?? false,
			mode: mode ?? variryAddressGeneratorMode.PREFIX,
		};
	}

	private calculateCharsetSize(caseSensitive: boolean): number {
		if (caseSensitive) {
			return 58;
		}
		return 34;
	}

	public calculateDifficulty(pattern: string): number {
		const charset = this.calculateCharsetSize(this.config.caseSensitive);

		return charset ** pattern.length;
	}

	public validatePattern(pattern: string): boolean {
		const validChars = new Set(BASE58_CHARS);
		return pattern.split('').every((char) => validChars.has(char));
	}

	public getValidCharacters(): string {
		return this.config.caseSensitive
			? BASE58_CHARS
			: [...new Set(BASE58_CHARS.toLowerCase())].join('');
	}

	public calculateProbability50(pattern: string): number {
		return Math.ceil(Math.LN2 * this.calculateDifficulty(pattern));
	}

	private matchPattern(address: string, pattern: string): boolean {
		const compareAddress = this.config.caseSensitive
			? address
			: address.toLowerCase();
		const comparePattern = this.config.caseSensitive
			? pattern
			: pattern.toLowerCase();

		if (this.config.mode === variryAddressGeneratorMode.PREFIX) {
			return compareAddress.startsWith(comparePattern);
		}

		return compareAddress.endsWith(comparePattern);
	}

	private async generateAddressBatch(
		size = 50,
	): Promise<Array<{ publicKey: string; privateKey: string }>> {
		const batch = [];
		for (let i = 0; i < size; i++) {
			const keypair = Keypair.generate();
			batch.push({
				publicKey: keypair.publicKey.toBase58(),
				privateKey: bs58.encode(keypair.secretKey),
			});
		}
		return batch;
	}

	public async generate(
		pattern: string,
		onProgress?: (progress: GenerateProgress) => void,
	): Promise<GenerateResult> {
		const _pattern = this.suggestAlternative(pattern.trim());

		if (!_pattern) {
			throw new Error('Pattern is required');
		}

		if (!this.validatePattern(_pattern)) {
			throw new Error('Invalid pattern: contains invalid characters');
		}

		this.isRunning = true;
		let attempts = 0;
		const startTime = Date.now();
		const difficulty = this.calculateDifficulty(_pattern);
		const batchSize = 500;

		try {
			while (this.isRunning) {
				const batch = await this.generateAddressBatch(batchSize);

				await new Promise((resolve) => requestAnimationFrame(resolve));

				for (const address of batch) {
					if (this.matchPattern(address.publicKey, _pattern)) {
						return {
							...address,
							attempts: attempts + batch.indexOf(address) + 1,
							timeSpent: Date.now() - startTime,
						};
					}
				}

				attempts += batchSize;

				onProgress?.({
					attempts,
					timeSpent: Date.now() - startTime,
					estimatedProgress: Math.min((attempts / difficulty) * 100, 97.99),
				});

				if ('requestIdleCallback' in globalThis) {
					await new Promise((resolve) =>
						(globalThis as any).requestIdleCallback(resolve, { timeout: 100 }),
					);
				} else {
					await new Promise((resolve) => setTimeout(resolve, 0));
				}
			}

			throw new Error('Generation stopped');
		} finally {
			this.isRunning = false;
		}
	}

	public stop(): void {
		this.isRunning = false;
	}

	public estimateTime(pattern: string): number {
		const difficulty = this.calculateDifficulty(pattern);
		const attemptsPerSecond = 10000;
		return Math.ceil(difficulty / attemptsPerSecond);
	}

	public getConfig(): Required<VaniryAddressGeneratorOptions> {
		return { ...this.config };
	}

	public updateConfig(options: Partial<VaniryAddressGeneratorOptions>): void {
		this.config = {
			...this.config,
			...options,
		};
	}

	public suggestAlternative(pattern: string): string {
		const replacements: { [key: string]: string } = {
			'0': '9',
			O: 'o',
			I: '1',
			l: '1',
		};

		return pattern
			.split('')
			.map((char) => replacements[char as keyof typeof replacements] || char)
			.join('');
	}
}

export const variryAddressGenerator = new VaniryAddressGenerator({
	caseSensitive: true,
});
