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
    mapping(uint => string) accountTypeValueMap;
    mapping(string => uint) accountTypeNameMap;

    constructor() public {
        contractOwner = msg.sender;
    }

    //  Accounts
    function AddAccount( address ownerAddress, string profile, uint timestamp, uint accountTypeVal ) public returns (bool success ) {
        string storage accountTypeName = accountTypeValueMap[accountTypeVal];
        bytes storage accountTypeNameBytes = bytes(accountTypeName);
        
        // if user does not exist and account type exists
        if ( !accountStructs[ownerAddress].isEntity && accountTypeNameBytes.length > 0) {
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
    
    function AddAccountType(string memory accountTypeName) public returns (bool success) {
        uint accountTypeValue = accountTypeNameMap[accountTypeName];
        
        if (accountTypeValue > 0) { // if accountType already exists
            return false;
        }
        
        uint newAccountTypeValue = accountTypeValues.length + 1;
        accountTypeValues.push(newAccountTypeValue);
        accountTypeValueMap[newAccountTypeValue] = accountTypeName;
        accountTypeNameMap[accountTypeName] = newAccountTypeValue;
        return true;
    }
    
    function GetAccountTypeValueFromName(string memory _name) public view returns(uint accountTypeValue) {
        return accountTypeNameMap[_name];
    }
    
    function GetAccountTypeNameFromValue(uint _value) public view returns(string accountTypeName) {
        return accountTypeValueMap[_value];
    }
    
    function GetAccountTypeValues() public view returns (uint[]) {
        return accountTypeValues;
    }
    
    function AccountTypeExists(string memory _name) public view returns (bool) {
        return accountTypeNameMap[_name] > 0;
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
            uint updated,
            uint accountType
        )
    {
        address ownerAddress = accountAddressesByProfile[_profile];
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
