pragma solidity ^0.4.24;

contract PoliciesAndTerms {
    struct Acceptance {
        string documentHash;
        uint timestamp;
        bool isEntity;
    }
    
    struct Document {
        string hash;
        uint timestamp;
        bool isEntity;
    }
    
    string[] private allDocumentHashes;
    
    // documentHash to Document mapping
    mapping(string => Document) allDocuments;
    
    // wallet address to acceptance
    mapping(address => Acceptance[]) allAcceptance;
    
    function addNewDocument(string _documentHash, uint _timestamp) public returns (bool success) {
        Document memory document = allDocuments[_documentHash];
        
        if (!document.isEntity) {
            allDocuments[_documentHash] = Document({
                hash: _documentHash,
                timestamp: _timestamp,
                isEntity: true
            });
        }
        
        allDocumentHashes.push(_documentHash);
        return true;
    }
    
    function getDocument(string _documentHash) 
        public
        view
        returns (
            string documentHash,
            uint timestamp,
            bool isEntity
        ) 
    {
        Document memory document = allDocuments[_documentHash];
        return (document.hash, document.timestamp, document.isEntity);
    }
    
    function saveAcceptance(address walletAddress, string documentHash, uint timestamp) public returns (bool success) {
        Acceptance memory acceptance = Acceptance({ documentHash: documentHash, timestamp: timestamp, isEntity: true });
        allAcceptance[walletAddress].push(acceptance);
        return true;
    }
    
    function getUserAcceptance(address walletAddress, string documentVersionHash) 
        public
        view
        returns (string documentHash, uint timestamp, bool isEntity)
    {
        Acceptance[] storage allUserAcceptance = allAcceptance[walletAddress];
        
        Acceptance memory acceptance;
        
        for (uint i = 0; i < allUserAcceptance.length; i++) {
            if (compareStrings(allUserAcceptance[i].documentHash, documentVersionHash)) {
                acceptance = allUserAcceptance[i];
                break;
            }
        }
        
        return (acceptance.documentHash, acceptance.timestamp, acceptance.isEntity);
    }
    
    function compareStrings (string a, string b) private pure returns (bool){
        return keccak256(abi.encodePacked(a)) == keccak256(abi.encodePacked(b));
    }
}