exports.singleQueryResult = {
  Id: 1,
  Name: 'O-87534',
  No_Aerial_Photo__c: false,
  Project__r: {
    Id: 2,
    Name: 'P-98765',
    Proposal_CAD__r: {
      Proposal_Completed__c: new Date()
    }
  },
  Service__r: {
    Id: 3,
    Service_Number__c: 'S-453490'
  }
}

exports.multipleQueryResults = [
  {
    Id: 1,
    Name: 'O-87534',
    No_Aerial_Photo__c: false,
    Project__r: {
      Id: 2,
      Name: 'P-98765'
    },
    Service__r: {
      Id: 3,
      Service_Number__c: 'S-453490'
    }
  },
  {
    Id: 2,
    Name: 'O-8901234',
    No_Aerial_Photo__c: false,
    Project__r: {
      Id: 3,
      name: 'P-34576'
    }
    // no service on this one intentionally
  }
]

exports.missingProject = {
  Id: 1,
  Name: 'O-87534',
  No_Aerial_Photo__c: false,
  Service__r: {
    Id: 3,
    Service_Number__c: 'S-453490'
  }
}
