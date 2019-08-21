pragma solidity ^0.4.24;

contract MyCare {

    struct Account {
        address chainAddress;
        string profile;
        bool isEntity;
        uint created;
        uint updated;
        bool active;
        bytes16 accountType;
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

    bytes16[] accountTypes;
    mapping(bytes16 => bool) accountTypesMap;

    constructor() public {
        contractOwner = msg.sender;

        bytes16[5] memory initialAccountTypes = [
            bytes16("PAYER"),
            bytes16("PROVIDER"),
            bytes16("Patient"),
            bytes16("RESEARCH"),
            bytes16("NETWORK")
        ];

        for (uint8 i = 0; i < initialAccountTypes.length; i++ ) {
            bytes16 accountType = initialAccountTypes[i];
            accountTypes.push(accountType);
            accountTypesMap[accountType] = true;
        }
    }

    //  Accounts
    function AddAccount( address ownerAddress, string profile, uint timestamp, bytes16 accountType ) public returns (bool success ) {
        // if user does not exist and account type exists
        if ( !accountStructs[ownerAddress].isEntity && accountTypesMap[accountType]) {
            accountStructs[ownerAddress].chainAddress = ownerAddress;
            accountStructs[ownerAddress].profile = profile;
            accountStructs[ownerAddress].isEntity = true;
            accountStructs[ownerAddress].active = true;
            accountStructs[ownerAddress].created = timestamp;
            accountStructs[ownerAddress].updated = timestamp;
            accountStructs[ownerAddress].accountType = accountType;
            accountList.push(ownerAddress);
            accountAddressesByProfile[profile] = ownerAddress;
        }
        return true;
    }

    function AddAccountType(bytes16 accountType) public returns (bool success) {
        if (accountTypesMap[accountType]) { // if accountType already exists
            return false;
        }

        accountTypesMap[accountType] = true;
        accountTypes.push(accountType);
        return true;
    }


    function AccountTypeExists(bytes16 accountType) public view returns (bool) {
        return accountTypesMap[accountType];
    }

    function GetAccountTypes() public view returns (bytes16[]) {
        return accountTypes;
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
            bytes16 accountType
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
            bytes16 accountType
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
}
