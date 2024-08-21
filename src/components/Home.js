import { ethers } from 'ethers';
import { useEffect, useState } from 'react';

import close from '../assets/close.svg';

const Home = ({ home, provider,account, escrow, toggleProp }) => {
    
    const [hasBought,sethasBought]=useState(false);
    const [hasLended,sethasLended]=useState(false);
    const [hasInspected,sethasInspected]=useState(false);
    const [hasSold,sethasSold]=useState(false);
    
    const [Buyer,setBuyer]=useState(null);
    const [Lender,setLender]=useState(null);
    const [Inspector,setInspector]=useState(null);
    const [Seller,setSeller]=useState(null);

    const [owner,setOwner]=useState(null);
    
    const fetchDetails=async()=>{
        //buyer

        const buyer=await escrow.buyer(home.id);
        setBuyer(buyer);
        const hasBought=await escrow.approval(home.id,buyer);
        sethasBought(hasBought);

        //seller

        const seller=await escrow.seller();
        setSeller(seller);
        const hasSold=await escrow.approval(home.id,seller);
        sethasSold(hasSold);
        //lender

        const lender=await escrow.lender();
        setLender(lender);
        const hasLended=await escrow.approval(home.id,lender);
        sethasLended(hasLended);

        // inspector

        const inspector=await escrow.inspector();
        setInspector(inspector);
        const hasInspected=await escrow.inspectionPassed(home.id);
        sethasInspected(hasInspected);

    }

    const fetchOwner=async()=>{
        if(await escrow.isListed(home.id)) return

        const owner=await escrow.buyer(home.id);
        setOwner(owner);
    }

    const buyHandler=async()=>{
        try{
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        await provider.send('eth_requestAccounts', []); // <- this prompts user to connect metamask
        const signer=provider.getSigner();

        const escrowAmount=await escrow.escrowAmount(home.id);
        let transaction=await escrow.connect(signer).depositEarnest(home.id,{value:escrowAmount});
        await transaction.wait();

        transaction=await escrow.connect(signer).approveSale(home.id);
        await transaction.wait(); 

        sethasBought(true);
        }catch(error){
            console.log("buy handler error",error);
        }
    }
    const inspectHandler=async()=>{
        const signer=await provider.getSigner();

        let transaction=await escrow.connect(signer).updateInspectionStatus(home.id,true);
        await transaction.wait();
        
        sethasInspected(true)
    }
    const lendHandler=async()=>{
        const signer=await provider.getSigner();
        // lend approves 
        const transaction=await escrow.connect(signer).approveSale(home.id);
        await transaction.wait();

        const lendAmount=(await escrow.purchasePrice(home.id) - await escrow.escrowAmount(home.id))
        await signer.sendTransaction({to:escrow.address,value:lendAmount.toString(),gasLimit:60000});
        
        sethasLended(true);
    }
    
    const sellHandler=async()=>{
        const signer=await provider.getSigner();
        // lend approves 
        let transaction=await escrow.connect(signer).approveSale(home.id);
        await transaction.wait();

        transaction=await escrow.connect(signer).finalizeSale(home.id);
        await transaction.wait();

        sethasSold(true);

    }

    useEffect(()=>{
        fetchDetails();
        fetchOwner();
    },[hasSold]);

    return (
        <div className="home">
            <div className='home__details'>
                <div className='home__image'>
                    <img src={home.image} alt='Home' />
                </div>

                <div className='home__overview'>
                    <h1>{home.name}</h1>
                    <p>
                        <strong>{home.attributes[2].value}</strong> bds |
                        <strong>{home.attributes[3].value}</strong> ba |
                        <strong>{home.attributes[4].value}</strong> sqft
                    </p>
                    <p>{home.address}</p>
                    <h2>{home.attributes[0].value} ETH</h2>

                    {owner ? (
                        <div className='home__owned'>
                            Owned by {owner.slice(0,6) + '...' + owner.slice(38,42)}
                        </div>
                    ) : (
                        <div>
                            {(account===Lender)?(   
                                <button className='home__buy' onClick={lendHandler} disabled={hasLended}>
                                    Approve & Lend
                                </button>
                            ):(account===Inspector)?(
                                <button className='home__buy' onClick={inspectHandler} disabled={hasInspected}>
                                    Approve Inspection
                                </button>
                            ):(account===Seller)?(
                                <button className='home__buy' onClick={sellHandler} disabled={hasSold}>
                                    Approve & Sell
                                </button>

                            ):(
                                <button className='home__buy' onClick={buyHandler} disabled={hasBought}>
                                    Buy
                                </button>
                            )}
                            <button className='home__contact'>
                                    Contact agent
                            </button>
                        </div>
                    )}

                    <hr/>
                    <h2>Overview</h2>
                    <p>{home.description}</p>

                    <hr/>
                    <h2>Facts and Features</h2>
                    <ul>
                        {home.attributes.map((attributes,index)=>(
                            <li key={index}><strong>{attributes.trait_type}</strong> : {attributes.value}</li>
                        ))

                        }
                    </ul>
                </div>

                <button onClick={toggleProp} className='home__close'>
                    <img src={close} alt='close' />
                </button>
            </div>

        </div>
    );
}

export default Home;
