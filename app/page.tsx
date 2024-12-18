'use client';

import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/ui/form';
import { variryAddressGenerator } from '@/lib/vanity-address-generator';
import {
	Button,
	Card,
	Progress,
	SegmentedControl,
	Text,
	TextField,
} from '@radix-ui/themes';
import { Keypair } from '@solana/web3.js';
import { useMutation } from '@tanstack/react-query';
import bs58 from 'bs58';
import numeral from 'numeral';
import React from 'react';
import { useForm, useWatch } from 'react-hook-form';

export default function Home() {
	const form = useForm({
		defaultValues: {
			vanityString: '',
			caseSensitive: 'yes',
			mode: 'prefix',
		},
	});

	const [egAddress, setEgAddress] = React.useState('');

	const vanityString = useWatch({
		control: form.control,
		name: 'vanityString',
	});

	const [vanityStringPlaceholder, setVanityStringPlaceholder] =
		React.useState('');

	const mode = useWatch({
		control: form.control,
		name: 'mode',
	});

	const [difficulty, setDifficulty] = React.useState(0);

	React.useEffect(() => {
		setVanityStringPlaceholder(mode === 'suffix' ? 'Suffix' : 'Perfix');

		const _egAddress = Keypair.generate().publicKey.toBase58();

		if (vanityString) {
			const _vanityString =
				variryAddressGenerator.suggestAlternative(vanityString);
			const _vanityAddress =
				mode === 'prefix'
					? _vanityString + _egAddress.slice(_vanityString.length)
					: _egAddress.slice(0, -_vanityString.length) + _vanityString;

			setDifficulty(variryAddressGenerator.calculateDifficulty(vanityString));
			setEgAddress(_vanityAddress);
		} else {
			setEgAddress(_egAddress);
		}
	}, [vanityString, mode]);

	const [attempts, setAttempts] = React.useState(0);
	const [estimatedProgress, setEstimatedProgress] = React.useState(0);
	const [wallet, setWallet] = React.useState({
		publickKey: '',
		secretKey: '',
	});

	const { mutate } = useMutation({
		mutationKey: ['generate-vanity-address'],
		mutationFn: async () => {
			return await variryAddressGenerator.generate(vanityString, (progress) => {
				setAttempts(progress.attempts);
				setEstimatedProgress(progress.estimatedProgress);
			});
		},
		onSuccess: (data) => {
			setWallet({
				publickKey: data.publicKey,
				secretKey: data.privateKey,
			});

			setEstimatedProgress(100);
		},
		onError: (error) => {
			console.log('error', error);
		},
	});

	return (
		<div className="container mx-auto p-4">
			<div className="flex justify-end gap-4 pb-4">
				<Button
					onClick={() => {
						if (!vanityString) {
							const wallet = Keypair.generate();

							setWallet({
								publickKey: wallet.publicKey.toBase58(),
								secretKey: bs58.encode(wallet.secretKey),
							});

							setEstimatedProgress(100);

							return;
						}

						mutate();
					}}
				>
					Start
				</Button>
				<Button color="gray" variant="outline">
					Stop
				</Button>
			</div>
			<div className="grid grid-cols-2 gap-4">
				<Card className="flex gap-2 flex-col">
					<Text size={'4'} weight={'bold'}>
						Solana Vanity Generator Options
					</Text>

					<Form {...form}>
						<div className="grid grid-cols-2 gap-4">
							<FormField
								name={'vanityString'}
								render={({ field }) => (
									<FormItem>
										<FormLabel>Enter your vanity string. ex: BTC</FormLabel>
										<FormControl>
											<TextField.Root
												placeholder={vanityStringPlaceholder}
												value={field.value}
												onChange={(e) => {
													const value = e.target.value;

													field.onChange(value);
												}}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormItem>
								<FormLabel>E.g</FormLabel>
								<FormControl>
									<TextField.Root
										disabled
										value={egAddress}
										className="text-xs"
									/>
								</FormControl>
								<FormMessage />
							</FormItem>

							<div className="grid grid-cols-2 col-span-1">
								<FormField
									name={'caseSensitive'}
									render={({ field }) => (
										<FormItem>
											<FormLabel>Case Sensitive</FormLabel>
											<FormControl>
												<div>
													<SegmentedControl.Root
														value={field.value}
														onValueChange={field.onChange}
													>
														<SegmentedControl.Item value="yes">
															Yes
														</SegmentedControl.Item>
														<SegmentedControl.Item value="no">
															No
														</SegmentedControl.Item>
													</SegmentedControl.Root>
												</div>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									name={'mode'}
									render={({ field }) => (
										<FormItem>
											<FormLabel>Mode</FormLabel>
											<FormControl>
												<div>
													<SegmentedControl.Root
														value={field.value}
														onValueChange={field.onChange}
													>
														<SegmentedControl.Item value="prefix">
															Prefix
														</SegmentedControl.Item>
														<SegmentedControl.Item value="suffix">
															Suffix
														</SegmentedControl.Item>
													</SegmentedControl.Root>
												</div>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
						</div>
					</Form>
				</Card>

				<Card className="flex gap-2 flex-col">
					<Text size={'4'} weight={'bold'}>
						Generating Information
					</Text>

					<Form {...form}>
						<div className="flex gap-3 flex-col">
							<div className="flex justify-between">
								<Text size={'2'}>Difficulty</Text>
								<div>
									<Text size={'2'} weight={'bold'}>
										{numeral(difficulty).format('0,0')}
									</Text>
								</div>
							</div>

							<div className="flex justify-between">
								<Text size={'2'}>Generate</Text>

								<div>
									<Text size={'2'} weight={'bold'}>
										{numeral(attempts).format('0,0')}
									</Text>
									&nbsp;
									<Text>address</Text>
								</div>
							</div>

							{/* <div className="flex justify-between">
								<Text size={'2'}>50% probability</Text>
								<div>
									<Text size={'2'} weight={'bold'}>
										{numeral(100000000000000).format('0,0')}
									</Text>
									&nbsp;
									<Text>address</Text>
								</div>
							</div> */}

							{/* <div className="flex justify-between">
								<Text size={'2'}>Speed</Text>
								<div>
									<Text size={'2'} weight={'bold'}>
										{numeral(100000000000000).format('0,0')}
									</Text>
									&nbsp;
									<Text>addr/s</Text>
								</div>
							</div> */}

							<div className="flex justify-between">
								<Text size={'2'}>Status</Text>
								<Text size={'2'}>
									{wallet.publickKey ? 'Completed' : 'In Progress'}
								</Text>
							</div>

							<div className="flex justify-between">
								<Progress value={estimatedProgress} />
							</div>
						</div>
					</Form>
				</Card>

				{wallet.publickKey && (
					<Card className="col-span-2">
						<div>
							<Text size={'2'} weight={'bold'}>
								Publick Key{' '}
							</Text>
							<Text size="2">{wallet.publickKey}</Text>
						</div>

						<div>
							<Text size={'2'} weight={'bold'}>
								Secret Key{' '}
							</Text>
							<Text size={'2'}>{wallet.secretKey}</Text>
						</div>
					</Card>
				)}
			</div>
		</div>
	);
}
