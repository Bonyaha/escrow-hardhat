/* eslint-env es2020 */

import { BrowserProvider, parseEther, formatEther } from 'ethers';
import { useEffect, useState } from 'react';
import deploy from './deploy';
import Escrow from './Escrow';

const provider = new BrowserProvider(window.ethereum);


export async function approve(escrowContract, signer, arbiterNumber) {
  console.log(`Arbiter ${arbiterNumber} attempting to approve`);
  console.log('signer is: ', signer);
  console.log('contract is: ', escrowContract);

  const balanceBefore = await provider.getBalance("0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC");
  console.log("Balance for beneficiar is: ", balanceBefore.toString());

  const approveTxn = await escrowContract.connect(signer).approve();
  await approveTxn.wait();

  const balanceAfter = await provider.getBalance("0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC");
  console.log("Balance for beneficiar is: ", balanceAfter.toString());
}

function App() {
  const [escrows, setEscrows] = useState([]);
  const [account, setAccount] = useState();
  const [signer, setSigner] = useState();


  useEffect(() => {
    async function getAccounts() {
      const accounts = await provider.send('eth_requestAccounts', []); //eth_requestAccounts method from MetaMask
      console.log('Initial accounts:', accounts);

      // In ethers.js v6, getSigner() returns a Promise and must be awaited
      const arbiter1 = document.getElementById('arbiter1').value;
      const arbiter2 = document.getElementById('arbiter2').value;
      const signerObj = await provider.getSigner();



      //const arbiter = accounts[1];
      console.log("Initial signer:", signerObj);

      //console.log('Arbiter is: ', arbiter);


      setAccount(accounts[0]);
      setSigner(signerObj);


    }

    getAccounts();


    // Listen for account changes and update signer
    /*  window.ethereum.on('accountsChanged', async (accounts) => {
       console.log('Accounts changed:', accounts);
 
       const signerObj = await provider.getSigner();
       console.log('Updated signer after account change:', signerObj);
 
       setAccount(accounts[0]);
       setSigner(signerObj);
     }); */

    // Clean up the listener when the component is unmounted
    /* return () => {
      window.ethereum.removeListener('accountsChanged', () => { });
    }; */
  }, []);


  async function newContract() {
    const beneficiary = document.getElementById('beneficiary').value;
    const arbiter1 = document.getElementById('arbiter1').value;
    const arbiter2 = document.getElementById('arbiter2').value;
    //const value = BigInt(document.getElementById('wei').value);
    const ethValue = document.getElementById('eth').value;
    const value = parseEther(ethValue); // This converts ETH to Wei
    console.log('Value in Wei:', value.toString());

    console.log('value is: ', ethValue);

    // Retrieve arbiter signers based on the input addresses
    const arbiterObj1 = await provider.getSigner(arbiter1);
    const arbiterObj2 = await provider.getSigner(arbiter2);

    const escrowContract = await deploy(signer, [arbiter1, arbiter2], beneficiary, value);

    // Get the deployed contract address using getAddress()
    const contractAddress = await escrowContract.getAddress();
    console.log('deployed contract address: ', contractAddress);

    const balance = await provider.getBalance(contractAddress);
    console.log(`Contract balance for ${contractAddress}:`, balance.toString());

    // Track approvals from both arbiters
    let arbiter1Approved = false;
    let arbiter2Approved = false;

    /* const approvedListener = (arbiter, amount) => {
      console.log('arbiter is: ', arbiter);      
      console.log('amount is', amount);
      console.log(`Approval from ${arbiter} with amount:`, formatEther(amount));

      if (arbiter === arbiter1) {
        arbiter1Approved = true;
      } else if (arbiter === arbiter2) {
        arbiter2Approved = true;
      }

      console.log(arbiter1Approved);
      console.log(arbiter2Approved);
      
      
      if (arbiter1Approved && arbiter2Approved) {
        document.getElementById(contractAddress).className = 'complete';
        document.getElementById(contractAddress).innerText = "✓ Approved by both arbiters!";
      } else if (arbiter1Approved || arbiter2Approved) {
        document.getElementById(contractAddress).innerText = "Awaiting second arbiter's approval...";
      }

     }*/;

    const approvedListener = (arbiter, amount) => {
      if (arbiter === arbiter1) {
        updateEscrowApprovalStatus(contractAddress, 1);
      } else if (arbiter === arbiter2) {
        updateEscrowApprovalStatus(contractAddress, 2);
      }
    };

    escrowContract.on('Approved', approvedListener);

    const escrow = {
      address: contractAddress,
      arbiter1,
      arbiter2,
      beneficiary,
      //value: value.toString(),
      value: ethValue, // Store the original ETH value for display
      valueWei: value.toString(),
      arbiter1Approved: false,
      arbiter2Approved: false,
      handleApprove: async (arbiterNumber) => {
        // Fetch the current signer each time before calling approve
        //const signer = await provider.getSigner();
        //const signerAddress = await signer.getAddress();

        /* if (signerAddress !== arbiter) {
          console.error("Error: Signer must be the arbiter to approve the contract");
          return;
        } */


        console.log(`Handling approve for arbiter ${arbiterNumber}`);

        try {
          if (arbiterNumber === 1) {
            await approve(escrowContract, arbiterObj1, 1);
          } else if (arbiterNumber === 2) {
            await approve(escrowContract, arbiterObj2, 2);
          }
        } catch (err) {
          console.error(`Error in approve for arbiter ${arbiterNumber}:`, err);
        }
      },
    };

    setEscrows([...escrows, escrow]);
    return () => {
      escrowContract.off('Approved', approvedListener);
    };
  }

  function updateEscrowApprovalStatus(contractAddress, arbiterNumber) {
    setEscrows((prevEscrows) =>
      prevEscrows.map((escrow) => {
        if (escrow.address === contractAddress) {
          return {
            ...escrow,
            arbiter1Approved: arbiterNumber === 1 ? true : escrow.arbiter1Approved,
            arbiter2Approved: arbiterNumber === 2 ? true : escrow.arbiter2Approved,
          };
        }
        return escrow;
      })
    );
  }
  console.log('escrows: ', escrows);


  return (
    <>
      <div className="contract">
        <h1> New Contract </h1>
        <label>
          First Arbiter Address
          <input type="text" id="arbiter1" />
        </label>

        <label>
          Second Arbiter Address
          <input type="text" id="arbiter2" />
        </label>

        <label>
          Beneficiary Address
          <input type="text" id="beneficiary" />
        </label>

        <label>
          Deposit Amount (in ETH)
          <input
            type="number"
            id="eth"
            step="0.01"
            min="0"
            placeholder="0.00"
          />
        </label>

        <div
          className="button"
          id="deploy"
          onClick={(e) => {
            e.preventDefault();

            newContract();
          }}
        >
          Deploy
        </div>
      </div>

      <div className="existing-contracts">
        <h1> Existing Contracts </h1>

        <div id="container">
          {escrows.map((escrow) => {
            return (
            <Escrow
              key={escrow.address}
              {...escrow}
              handleApprove1={() => escrow.handleApprove(1)}
              handleApprove2={() => escrow.handleApprove(2)}
            />
             /* { <div>
                Arbiter 1: {escrow.arbiter1} &nbsp; | &nbsp; Arbiter 2: {escrow.arbiter2}
              </div>
            </Escrow> }*/
            );
          })}
          
        </div>
      </div>
    </>
  );
}

export default App;
