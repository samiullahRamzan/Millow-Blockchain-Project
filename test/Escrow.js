const { expect } = require('chai');
const { ethers } = require('hardhat');

const tokens = (n) => {
    return ethers.utils.parseUnits(n.toString(), 'ether')
}

describe('Escrow', () => {
    let realEstate,escrow;
    let buyer,seller,inspector,lender;
    
    beforeEach(async()=>{
        // get different dummy accounts;
        [buyer,seller,inspector,lender]=await ethers.getSigners();
        // deploy smart contracts
        const RealEstate=await ethers.getContractFactory('RealEstate');
        realEstate=await RealEstate.deploy();

        // mint function
        let transaction=await realEstate.connect(seller).mint('https://ipfs.io/ipfs/QmQUozrHLAusXDxrvsESJ3PYB3rUeUuBAvVWw6nop2uu7c/1.png');
        //let transaction1=await realEstate.connect(seller).mint('https://ipfs.io/ipfs/QmQUozrHLAusXDxrvsESJ3PYB3rUeUuBAvVWw6nop2uu7c/2.png');
        await transaction.wait();
        //await transaction1.wait();
    
        const Escrow=await ethers.getContractFactory('Escrow');
        escrow=await Escrow.deploy(
            realEstate.address,
            inspector.address,
            lender.address,
            seller.address
        );
        transaction=await realEstate.connect(seller).approve(escrow.address,0);
        await transaction.wait();
        // //list property
        transaction=await escrow.connect(seller).list(0,buyer.address,tokens(10),tokens(10));
        await transaction.wait();
    })

    describe('deployment',()=>{
        it('Returns NFT address',async()=>{
            const result=await escrow.nftAddress();
            expect(result).to.be.equal(realEstate.address);
        })
        it('Returns seller',async()=>{
            const result=await escrow.seller();
            expect(result).to.be.equal(seller.address);
            
        })
        it('Returns inspector',async()=>{
            const result=await escrow.inspector();
            expect(result).to.be.equal(inspector.address);
        })
        it('Returns lender',async()=>{
            const result=await escrow.lender();
            expect(result).to.be.equal(lender.address);
        })
    })

    describe('Listing',()=>{
        it('Updated the ownership',async()=>{
            expect(await realEstate.ownerOf(0)).to.be.equal(escrow.address);
        })
        it('Updated as Listed',async()=>{
            const result=await escrow.isListed(0);
            expect(result).to.be.equal(true);
        })
        it("returns buyer",async()=>{
            const result=await escrow.buyer(0);
            expect(result).to.be.equal(buyer.address);
        })
        it("returns purchaseprice",async()=>{
            const result=await escrow.purchasePrice(0);
            expect(result).to.be.equal(tokens(10));
        })
        it("returns escrow amount",async()=>{
            const result=await escrow.purchasePrice(0);
            expect(result).to.be.equal(tokens(10));
        })
    })
   
    describe("deposite",()=>{
        it("Update the balance",async()=>{
            const transaction=await escrow.connect(buyer).depositEarn(0,{value:tokens(15)});
            await transaction.wait();
            const result=await escrow.getBalance();
            expect(result).to.be.equal(tokens(15));
        })
    })

    describe("Inspector",()=>{
        it("verify by inspector",async()=>{
            const transaction=await escrow.connect(inspector).updateInspectionStatus(0,true);
            await transaction.wait();
            const result=await escrow.inspectionPassed(0);
            expect(result).to.be.equal(true);
        })
    })

    describe("Approval",()=>{
        it("Update the approval status",async()=>{
            let  transaction=await escrow.connect(buyer).approveSale(0);
            await transaction.wait();
            transaction=await escrow.connect(seller).approveSale(0);
            await transaction.wait();
            transaction=await escrow.connect(lender).approveSale(0);
            await transaction.wait();

            expect(await escrow.approval(0,buyer.address)).to.be.equal(true);
            expect(await escrow.approval(0,seller.address)).to.be.equal(true);
            expect(await escrow.approval(0,lender.address)).to.be.equal(true);
        })
    })

    describe("Sale",async()=>{
        beforeEach(async()=>{
            let transaction=await escrow.connect(buyer).depositEarn(0,{value:tokens(15)});
            await transaction.wait();
            
            transaction=await escrow.connect(inspector).updateInspectionStatus(0,true);
            await transaction.wait();
            
            transaction=await escrow.connect(buyer).approveSale(0);
            await transaction.wait();
            
            transaction=await escrow.connect(seller).approveSale(0);
            await transaction.wait();
            
            transaction=await escrow.connect(lender).approveSale(0);
            await transaction.wait();
            
            await lender.sendTransaction({to:escrow.address,value:tokens(5)});
            
            transaction=await escrow.connect(seller).finalizeSale(0);
            await transaction.wait();
        })

        it("works",async()=>{

        })
        it("updates the escrow balance",async()=>{
            expect(await escrow.getBalance()).to.be.equal(0);
        })
        it("Updates the ownership",async()=>{
            expect(await realEstate.ownerOf(0)).to.be.equal(buyer.address);
        })
    })
   
})
