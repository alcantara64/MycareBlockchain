pragma solidity ^0.4.17;

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
    
    struct ConnectionAttempt {
        address from;
        address to;
        uint created;
        uint updated;
        bool accepted;
        bool isEntity;
    }
    
    mapping(string => Consent) allConsents;
    mapping(string => ConnectionAttempt) allConnections;
    mapping(address => string[]) userConnectionAttempts;
    mapping(address => string[]) userConsents;
    
    function addConsent(
        string consentId,
        uint timestamp,
        bytes16 scope,
        address[] dataSource,
        uint startDate,
        uint endDate,
        string connectionId
    ) public returns(bool) {
        
        ConnectionAttempt memory connection = allConnections[connectionId];
        
        if (connection.isEntity) {
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
    
    function getConsent(string _consentId) public view returns(
        string consentId,
        string connectionId,
        uint created,
        uint updated,
        bytes16 scope,
        address[] dataSource,
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
    
    function canAccess(string _consentId) public view returns(bool) {
        Consent memory consent = allConsents[_consentId];
        
        return (consent.isEntity && !consent.revoked);
    }
    
    function addConnectionAttempt(
        string connectionId,
        address from,
        address to,
        uint created
        ) public returns(bool) {
            
        if (allConnections[connectionId].isEntity) {
            return false;
        }
        
        ConnectionAttempt memory connection = ConnectionAttempt({
            from: from,
            to: to,
            created: created,
            updated: created,
            accepted: false,
            isEntity: true
        });
        
        allConnections[connectionId] = connection;
        
        return true;
    }
    
    function getConnectionAttempt(string _connectionId) public view returns(
        string connectionId,
        address from,
        address to,
        uint created,
        uint updated,
        bool accepted,
        bool isEntity
        ) {
        ConnectionAttempt memory connection = allConnections[_connectionId];
        
        return (
            _connectionId,
            connection.from,
            connection.to,
            connection.created,
            connection.updated,
            connection.accepted,
            connection.isEntity
        );
    }
    
    function updateConnectionAttempt(string _connectionId, bool accepted, uint timestamp) public returns(bool) {
        ConnectionAttempt storage connection = allConnections[_connectionId];
        
        connection.accepted = accepted;
        connection.updated = timestamp;
        
        return true;
    }
    
    function revokeConsent(string _consentId, uint timestamp) public returns(bool success) {
        Consent storage consent = allConsents[_consentId];
        consent.revoked = true;
        consent.updated = timestamp;
        return true;
    } 
}