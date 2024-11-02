import { useEffect, useState } from 'react';
import axios from 'axios';
import { BrowserProvider, parseEther, formatEther, ethers } from 'ethers';
import deploy from './deploy';
import Escrow from './Escrow';
import EscrowArtifact from './artifacts/contracts/Escrow.sol/Escrow';

const provider = new BrowserProvider(window.ethereum);

const API_URL = 'http://localhost:3001/contracts';

export async function approve(escrowContract, arbiterNumber, beneficiar) {
  console.log('in approve function');

  const signer = await provider.getSigner();
  console.log(`Arbiter ${arbiterNumber} attempting to approve`);
  console.log('signer is: ', signer);

  const approveTxn = await escrowContract.connect(signer).approve();
  await approveTxn.wait();
}

async function fetchContracts() {
  const response = await axios.get(API_URL);
  return response.data;
}

async function saveContractToServer(contractData) {
  const strippedData = {
    id: contractData.address,
    address: contractData.address,
    arbiter1: contractData.arbiter1,
    arbiter2: contractData.arbiter2,
    beneficiary: contractData.beneficiary,
    value: contractData.value,
    arbiter1Approved: contractData.arbiter1Approved,
    arbiter2Approved: contractData.arbiter2Approved,
  };
   
    const response = await axios.post(API_URL, strippedData, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return response.data;  
}

  // Update contract in JSON server
  async function updateContractInServer(contractAddress, arbiterUpdates) {
    const existingContracts = await fetchContracts();
    const existingContract = existingContracts.find(contract => contract.address === contractAddress);

    const updatedContractData = { ...existingContract, ...arbiterUpdates };
    const response = await axios.put(`${API_URL}/${contractAddress}`, updatedContractData, {
      headers: { 'Content-Type': 'application/json' },
    });
    return response.data;
  }

  // Centralized escrow initialization function
  function initializeEscrow(escrowData, contractInstance) {
    return {
      ...escrowData,
      contract: contractInstance,
      handleApprove: async (arbiterNumber) => {
        const signer = await provider.getSigner();
        const signerAddress = await signer.getAddress();

        if (signerAddress !== escrowData.arbiter1 && signerAddress !== escrowData.arbiter2) {
          console.error("Signer must be an arbiter to approve.");
          return;
        }

        try {
          await approve(contractInstance, arbiterNumber, escrowData.beneficiary);
          const approvalField = arbiterNumber === 1 ? 'arbiter1Approved' : 'arbiter2Approved';

          // Update JSON server with the approval status
          const updatedData = await updateContractInServer(escrowData.address, {
            [approvalField]: true,
          });
          console.log('Contract updated in server:', updatedData);
        } catch (err) {
          console.error(`Error in approving with arbiter ${arbiterNumber}:`, err);
        }
      },
    };
  }

  function App() {
    const [escrows, setEscrows] = useState([]);
    //const [account, setAccount] = useState();
    const [signer, setSigner] = useState();

    useEffect(() => {
      async function getAccounts() {
        const accounts = await provider.send('eth_requestAccounts', []); //eth_requestAccounts method from MetaMask
        //console.log('Initial accounts:', accounts);

        // In ethers.js v6, getSigner() returns a Promise and must be awaited
        const signerObj = await provider.getSigner();
        //setAccount(accounts[0]);
        setSigner(signerObj);
      }

      getAccounts();

      // Listen for account changes and update signer
      window.ethereum.on('accountsChanged', async (accounts) => {
        //console.log('Accounts changed:', accounts);

        const signerObj = await provider.getSigner();
        console.log('Updated signer after account change:', signerObj);

        //setAccount(accounts[0]);
        setSigner(signerObj);
      });

      // Clean up the listener when the component is unmounted
      return () => {
        window.ethereum.removeListener('accountsChanged', () => { });
      };
    }, []);

    useEffect(() => {
      async function loadContracts() {
        console.log('in loadContracts function');

        const contracts = await fetchContracts();
        const reinitializedContracts = contracts.map((data) => {
          console.log(data);

          const contract = new ethers.Contract(data.address, EscrowArtifact.abi, signer);
          return initializeEscrow(data, contract);
        });


        setEscrows(reinitializedContracts);
      }
      if (signer) {
        loadContracts();
      }
    }, [signer]);

    // Centralize listener for "Approved" events
    useEffect(() => {
      escrows.forEach((escrow) => {
        const { contract, arbiter1, arbiter2, address } = escrow;

        const approvedListener = (arbiter, amount) => {
          console.log('in approvedListener');
          console.log('arbiter is: ', arbiter);

          if (arbiter === arbiter1) {
            updateEscrowApprovalStatus(address, 1);
          } else if (arbiter === arbiter2) {
            updateEscrowApprovalStatus(address, 2);
          }
        };

        if (contract) {
          escrow.contract.on('Approved', approvedListener);
        }

        // Clean up event listeners when component is unmounted
        return () => {
          if (contract) {
            escrow.contract.off('Approved', approvedListener);
          }
        };
      });
    }, [escrows]);


    //console.log('signer is: ', signer);

    async function newContract() {
      const beneficiary = document.getElementById('beneficiary').value;
      const arbiter1 = document.getElementById('arbiter1').value;
      const arbiter2 = document.getElementById('arbiter2').value;
      const ethValue = document.getElementById('eth').value;
      const value = parseEther(ethValue); // This converts ETH to Wei
      
      const escrowContract = await deploy(signer, [arbiter1, arbiter2], beneficiary, value);
      const contractAddress = await escrowContract.getAddress();

      const escrow = {
        id: contractAddress,
        address: contractAddress,
        arbiter1,
        arbiter2,
        beneficiary,
        value: ethValue,
        arbiter1Approved: false,
        arbiter2Approved: false,        
      };

      // Save the contract to json-server
      const savedContract = await saveContractToServer(escrow);
      const initializedEscrow = initializeEscrow(savedContract, escrowContract);
      setEscrows([...escrows, initializedEscrow]);
    }

    function updateEscrowApprovalStatus(contractAddress, arbiterNumber) {
      console.log('in updateEscrowApprovalStatus');

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
    console.log('escrows are', escrows);

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
            {escrows.map((escrow) => (
              <Escrow
                key={escrow.address}
                {...escrow}
                handleApprove1={() => escrow.handleApprove(1)}
                handleApprove2={() => escrow.handleApprove(2)}
              />
            ))}
          </div>
        </div>
      </>
    );
  }

  export default App;
