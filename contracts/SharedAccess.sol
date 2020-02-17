pragma solidity ^0.5.11;

contract SharedAccess {
    struct Consent {
        uint created;
        uint updated;
        bytes16 scope;
        address[] dataSource;
        uint startDate;
        uint endDate;
        string connectionId;
        bool revoked;
        bool isEntity;
        
    }

    struct Connection {
        address from;
        address to;
        uint created;
        uint updated;
        bool accepted;
        bool isEntity;
        bool isDeleted;
    }

    mapping(string => Consent) allConsents;
    mapping(string => Connection) allConnections;

    function addConsent(
        string memory consentId,
        uint timestamp,
        bytes16 scope,
        address[] memory dataSource,
        uint startDate,
        uint endDate,
        string memory connectionId
    ) public returns(bool) {

        Connection memory connection = allConnections[connectionId];

        if (connection.isEntity && !allConsents[consentId].isEntity) {
            allConsents[consentId] = Consent({
                created: timestamp,
                updated: timestamp,
                scope: scope,
                dataSource: dataSource,
                startDate: startDate,
                endDate: endDate,
                connectionId: connectionId,
                revoked: false,
                isEntity: true
            });

            return true;
        }

        return false;
    }

    function getConsent(string memory _consentId) public view returns(
        string memory consentId,
        string memory connectionId,
        uint created,
        uint updated,
        bytes16 scope,
        address[] memory dataSource,
        uint startDate,
        uint endDate,
        bool revoked,
        bool isEntity
        ){
        Consent memory consent = allConsents[_consentId];

        return (
            _consentId,
            consent.connectionId,
            consent.created,
            consent.updated,
            consent.scope,
            consent.dataSource,
            consent.startDate,
            consent.endDate,
            consent.revoked,
            consent.isEntity
        );
    }

    function canAccess(string memory _consentId) public view returns(bool) {
        Consent memory consent = allConsents[_consentId];

        return (consent.isEntity && !consent.revoked);
    }

    function addConnection(
        string memory connectionId,
        address from,
        address to,
        uint created
        ) public returns(bool) {

        if (allConnections[connectionId].isEntity) {
            return false;
        }

        Connection memory connection = Connection({
            from: from,
            to: to,
            created: created,
            updated: created,
            accepted: true,
            isEntity: true,
            isDeleted: false
        });

        allConnections[connectionId] = connection;

        return true;
    }

    function getConnection(string memory _connectionId) public view returns(
        string memory connectionId,
        address from,
        address to,
        uint created,
        uint updated,
        bool accepted,
        bool isEntity,
        bool isDeleted
        ) {
        Connection memory connection = allConnections[_connectionId];

        return (
            _connectionId,
            connection.from,
            connection.to,
            connection.created,
            connection.updated,
            connection.accepted,
            connection.isEntity,
            connection.isDeleted
        );
    }

    function updateConnection(string memory _connectionId, bool isDeleted, uint timestamp) public returns(bool) {
        Connection storage connection = allConnections[_connectionId];

        connection.updated = timestamp;
        connection.isDeleted = isDeleted;

        return true;
    }

    function revokeConsent(string memory _consentId, uint timestamp) public returns(bool success) {
        Consent storage consent = allConsents[_consentId];
        consent.revoked = true;
        consent.updated = timestamp;
        return true;
    }
}