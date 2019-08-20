pragma solidity ^0.4.24;

contract MyCare {

    struct Account {
        address chainAddress;
        string profile;
        bool isEntity;
        uint created;
        uint updated;
        bool active;
        uint accountType;
    }

    struct AccountType {
        bool isEntity;
        string name;
    }


    // Storage
    address contractOwner;

    address[] userFilesList;

    mapping ( address => Account ) private accountStructs;
    mapping ( string => address ) private accountAddressesByProfile;
    address[] public accountList;
    
    uint[] accountTypeValues;
    mapping(uint => AccountType) accountTypes;

    constructor() public {
        contractOwner = msg.sender;
    }

    //  Accounts
    function AddAccount( address ownerAddress, string profile, uint timestamp, uint accountTypeVal ) public returns (bool success ) {
        AccountType storage accountType = accountTypes[accountTypeVal];
        if ( !accountStructs[ownerAddress].isEntity && accountType.isEntity) {
            accountStructs[ownerAddress].chainAddress = ownerAddress;
            accountStructs[ownerAddress].profile = profile;
            accountStructs[ownerAddress].isEntity = true;
            accountStructs[ownerAddress].active = true;
            accountStructs[ownerAddress].created = timestamp;
            accountStructs[ownerAddress].updated = timestamp;
            accountStructs[ownerAddress].accountType = accountTypeVal;
            accountList.push(ownerAddress);
            accountAddressesByProfile[profile] = ownerAddress;
        }
        return true;
    }
    
    function AddAccountType(uint accountTypeVal, string memory accountTypeName) public returns (bool success) {
        AccountType storage existingType = accountTypes[accountTypeVal];
        
        if (existingType.isEntity) {
            return false;
        }
        
        accountTypeValues.push(accountTypeVal);
        accountTypes[accountTypeVal] = AccountType({ name: accountTypeName, isEntity: true });
        return true;
    }
    
    function GetAccountTypeFromName(string memory _name) public view returns(string name, uint value, bool isEntity) {
        uint _value;
        bool _isEntity;
        for (uint i = 0; i < accountTypeValues.length; i++) {
            uint accountTypeVal = accountTypeValues[i];
            AccountType memory accountType = accountTypes[accountTypeVal];
            
            if (CompareStrings(accountType.name, _name)) {
                _value = accountTypeVal;
                _isEntity = accountType.isEntity;
            }
        }
        
        return (_name, _value, _isEntity);
    }
    
    function GetAccountTypeFromValue(uint _value) public view returns(string name, uint value, bool isEntity) {
        AccountType memory accountType = accountTypes[_value];
        return (accountType.name, _value, accountType.isEntity);
    }
    
    function GetAccountTypeValues() public view returns (uint[]) {
        return accountTypeValues;
    }
    
    function DeactivateAccount(address ownerAddress, uint timestamp) public returns (bool success) {
        accountStructs[ownerAddress].active = false;
        accountStructs[ownerAddress].updated = timestamp;
        return true;
    }

    function GetAccountByProfile( string _profile )
        public
        view
        returns (
            address walletAddress,
            string profile,
            bool isEntity,
            bool active,
            uint created,
            uint updated
        )
    {
        address ownerAddress = accountAddressesByProfile[_profile];
        return (
            accountStructs[ownerAddress].chainAddress,
            accountStructs[ownerAddress].profile,
            accountStructs[ownerAddress].isEntity,
            accountStructs[ownerAddress].active,
            accountStructs[ownerAddress].created,
            accountStructs[ownerAddress].updated
        );
    }

    function GetAccount(address ownerAddress)
        public
        view
        returns (
            address walletAddress,
            string profile,
            bool isEntity,
            bool active,
            uint created,
            uint updated,
            uint accountType
        )
    {
        return (
            accountStructs[ownerAddress].chainAddress,
            accountStructs[ownerAddress].profile,
            accountStructs[ownerAddress].isEntity,
            accountStructs[ownerAddress].active,
            accountStructs[ownerAddress].created,
            accountStructs[ownerAddress].updated,
            accountStructs[ownerAddress].accountType
        );
    }

    function GetAccountCount() public view returns (uint) {
        return accountList.length;
    }
    
    function CompareStrings(string memory a, string memory b) private pure returns (bool) {
        return (keccak256(abi.encodePacked((a))) == keccak256(abi.encodePacked((b))) );
    }
}
