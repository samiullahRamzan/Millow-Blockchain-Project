import { useEffect, useState } from 'react';
import { ethers } from 'ethers';

// Components
import Navigation from './components/Navigation';
import Search from './components/Search';
import Home from './components/Home';

// ABIs
import RealEstate from './abis/RealEstate.json'
import Escrow from './abis/Escrow.json'

// Config
import config from './config.json';

function App() {
  const [account,setAccount]=useState(null);
  const [escrowstate,setEscrowstate]=useState(null);
  const [provider,setProvider]=useState(null);
  const [Homes,setHomes]=useState([]);
  const [Home1,setHome1]=useState(null);
  const [toggle,setToggle]=useState(false);

  const loadBlockchainData=async()=>{
    const provider=new ethers.providers.Web3Provider(window.ethereum);
    setProvider(provider);
    
    const network=provider.getNetwork();
    const realEstate=new ethers.Contract(config[(await network).chainId].realEstate.address,RealEstate,provider);
    const totalSupply=await realEstate.totalSupply();
    const homes=[];

    for (var i = 0; i < totalSupply; i++) {
      try {
        const uri = await realEstate.tokenURI(i+1);
        const response = await fetch(uri);
        const metaData = await response.json();
        homes.push(metaData)
      } catch (error) {
        console.error("Error fetching metadata and uri:", error);
      }
    }

    setHomes(homes);
    
    const escrow=new ethers.Contract(config[(await network).chainId].escrow.address,Escrow,provider);
    setEscrowstate(escrow);

    window.ethereum.on("accountsChanged",async()=>{
      const accounts=await window.ethereum.request({method:'eth_requestAccounts'});
      const account=ethers.utils.getAddress(accounts[0]);
      setAccount(account);
    })
  }

  useEffect(()=>{
    loadBlockchainData();
  },[])
  
  const toggleProp=(home)=>{
    setHome1(home);
    toggle ? setToggle(false): setToggle(true);
  }

  return (
    <div>
      <Navigation account={account} setAccount={setAccount}/>
      <Search/>
      <div className='cards__section'>
        <div>
          <h3>Homes for you</h3>
          <hr/>
        </div>
        <div className='cards'>
          {Homes.map((home,index)=>(
            <div className='card' key={index} onClick={()=>toggleProp(home)}>
              <div className='card__image'>
                <img src={home.image} alt='Home'/>
              </div>
              <div className='card__info'>
                <h4>{home.attributes[0].value} ETH</h4>
                <p>
                  <strong>{home.attributes[2].value}</strong> bds |
                  <strong>{home.attributes[3].value}</strong> ba |
                  <strong>{home.attributes[4].value}</strong> sqft
                </p>
                <p>{home.address}</p>
              </div>

            </div>
          ))}    
        </div>
      </div>
      
      {toggle &&(
        <Home home={Home1} provider={provider} account={account} escrow={escrowstate} toggleProp={toggleProp}/>
      )}
    
    </div>
  );
}

export default App;
