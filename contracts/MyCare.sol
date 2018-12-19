pragma solidity ^0.4.24;

contract MyCare {

    struct Account {
        address chainAddress;
        string profile;
        bool isEntity;
        uint created;
        uint updated;
        bool active;
    }


    // Storage
    address contractOwner;

    address[] userFilesList;

    mapping ( address => Account ) private accountStructs;
    mapping ( string => address ) private accountAddressesByProfile;
    address[] public accountList;

    constructor() public {
        contractOwner = msg.sender;
    }

    //  Accounts
    function AddAccount( address ownerAddress, string profile, uint timestamp ) public returns (bool success ) {
        if ( ! accountStructs[ownerAddress].isEntity ) {
            accountStructs[ownerAddress].chainAddress = ownerAddress;
            accountStructs[ownerAddress].profile = profile;
            accountStructs[ownerAddress].isEntity = true;
            accountStructs[ownerAddress].active = true;
            accountStructs[ownerAddress].created = timestamp;
            accountStructs[ownerAddress].updated = timestamp;
            accountList.push(ownerAddress);
            accountAddressesByProfile[profile] = ownerAddress;
        }
        return true;
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
            uint updated
        )
    {
        return (
            accountStructs[ownerAddress].chainAddress,
            accountStructs[ownerAddress].profile,
            accountStructs[ownerAddress].isEntity,
            accountStructs[ownerAddress].active,
            accountStructs[ownerAddress].created,
            accountStructs[ownerAddress].updated
        );
    }

    function GetAccountCount() public view returns (uint) {
        return accountList.length;
    }
}
