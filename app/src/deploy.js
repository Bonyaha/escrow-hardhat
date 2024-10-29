import { ethers } from 'ethers';
import Escrow from './artifacts/contracts/Escrow.sol/Escrow';


export default async function deploy(signer, arbiters, beneficiary, value) {
  try {
    console.log('Starting deployment with:', {
      signer,
      arbiters,
      beneficiary,
      value: value.toString() // Convert BigInt to string for logging
    });

    const factory = new ethers.ContractFactory(
      Escrow.abi,
      Escrow.bytecode,
      signer
    );

    console.log('Factory created, attempting deployment...');
    const contract = await factory.deploy(arbiters[0], arbiters[1], beneficiary, { value });
    console.log('contract:', contract);
    
    // Wait for deployment to complete
    await contract.waitForDeployment();
    const contractAddress = await contract.getAddress();
    console.log('Contract deployed at:', contractAddress);

    const provider = signer.provider; // Assuming signer has a provider attached
    const balance = await provider.getBalance(contractAddress);
    console.log(`Contract balance for ${contractAddress}:`, ethers.formatEther(balance), 'ETH');
    
    return contract;
  } catch (error) {
    console.error('Deployment failed:', error);
    throw error; // Re-throw to handle in the UI
  }
}

//0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC