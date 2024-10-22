import { ethers } from 'ethers';
import Escrow from './artifacts/contracts/Escrow.sol/Escrow';
/* 
export default async function deploy(signer, arbiter, beneficiary, value) {
  console.log('signer is: ', signer);
  console.log('arbiter is :', arbiter);
  
  
  const factory = new ethers.ContractFactory(
    Escrow.abi,
    Escrow.bytecode,
    signer
  );
  console.log(factory);
  
  return factory.deploy(arbiter, beneficiary, { value });
}
 */


export default async function deploy(signer, arbiter, beneficiary, value) {
  try {
    console.log('Starting deployment with:', {
      signer,
      arbiter,
      beneficiary,
      value: value.toString() // Convert BigInt to string for logging
    });

    const factory = new ethers.ContractFactory(
      Escrow.abi,
      Escrow.bytecode,
      signer
    );

    console.log('Factory created, attempting deployment...');
    const contract = await factory.deploy(arbiter, beneficiary, { value });
    console.log('contract:', contract);
    
    // Wait for deployment to complete
    await contract.waitForDeployment();
    console.log('Contract deployed at:', await contract.getAddress());
    
    return contract;
  } catch (error) {
    console.error('Deployment failed:', error);
    throw error; // Re-throw to handle in the UI
  }
}