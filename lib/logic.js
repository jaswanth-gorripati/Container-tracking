'use strict';
/**
 * Write your transction processor functions here
 */

/**
 * Adding Container to the Network 
 * @param {org.ctbs.Add_Container} add_Container
 * @transaction
 */

function add_Container(containerDetails) {
    var factory = getFactory();
    var user = getCurrentParticipant();
    if(user.getFullyQualifiedType() != "org.ctbs.ContainerAgency"){
        throw new Error("User is not affilated to Container Agency , Hence cannot make this transaction");
    }
    var NS = "org.ctbs";
    var containerAsset = factory.newResource(NS,'Container',containerDetails.container_details.container_id);
    containerAsset.ownedByAgency = user
    containerAsset.Size = containerDetails.container_details.Size
    containerAsset.Type = containerDetails.container_details.Type
    containerAsset.Material = containerDetails.container_details.Material
    containerAsset.Outside_Height = containerDetails.container_details.Outside_Height
    containerAsset.Tare_Weight = containerDetails.container_details.Tare_Weight
    containerAsset.Max_Cargo_Capacity = containerDetails.container_details.Max_Cargo_Capacity
    containerAsset.Door_Opening = containerDetails.container_details.Door_Opening
    containerAsset.Dimensions = containerDetails.container_details.Dimensions
    containerAsset.current_location = containerDetails.container_details.current_location
    containerAsset.Status = "NOT_ASSIGNED";
    containerAsset.Cargo_status ="EMPTY";
    containerAsset.Avilable_cargo_space = containerDetails.container_details.Max_Cargo_Capacity;
    if(!user.containersOwned){
        user.containersOwned = []
    }
    user.containersOwned.push(containerAsset);
    var AddingContainerEvent = factory.newEvent(NS,'Adding_Container');
    AddingContainerEvent.containerID = containerAsset;
    return getAssetRegistry(NS+'.Container')
    .then(function(ca){
        return ca.add(containerAsset);
    })
    .then(function(){
        return getParticipantRegistry(NS+'.ContainerAgency')
    })
    .then(function(cAgency){
        return cAgency.update(user);
    })
}



/**
 * Adding Truck to the Network 
 * @param {org.ctbs.Add_Truck} add_Truck
 * @transaction
 */
function add_Truck(details){
    var factory = getFactory();
    var NS = "org.ctbs"
    var user = getCurrentParticipant();
    if(user.getFullyQualifiedType() != "org.ctbs.TruckAgency"){
        throw new Error("User is not affilated to Truck Agency , Hence cannot make this transaction");
    }
    var truckAsset = factory.newResource(NS,"Truck",details.regNo);
    truckAsset.ownedByAgency = user;
    truckAsset.driver = details.driver;
    truckAsset.trailer = details.trailer;
    truckAsset.current_location = details.current_location;
    truckAsset.status = "HALT";
    if(!user.trucksOwned){
        user.trucksOwned = []
    }
    user.trucksOwned.push(truckAsset);
    return getAssetRegistry(NS+'.Truck')
    .then(function(ta){
        return ta.add(truckAsset);
    })
    .then(function(){
        return getParticipantRegistry(NS+'.TruckAgency')
    })
    .then(function(tAgency){
        return tAgency.update(user);
    })
}
/**
 * Adding Ramp to the Network 
 * @param {org.ctbs.Add_Ramp} add_Ramp
 * @transaction
 */
function add_Ramp(details){
    var factory = getFactory();
    var NS = "org.ctbs"
    var user = getCurrentParticipant();
    if(user.getFullyQualifiedType() != "org.ctbs.RampAgency"){
        throw new Error("User is not affilated to Ramp Agency , Hence cannot make this transaction");
    }
    var rampAsset = factory.newResource(NS,"RailRamp",details.rampId);
    rampAsset.ownedByAgency = user;
    rampAsset.location = details.location;
    rampAsset.ramp_status = details.ramp_status;
    if(!user.rampsOwned){
        user.rampsOwned = []
    }
    user.rampsOwned.push(rampAsset);
    return getAssetRegistry(NS+'.RailRamp')
    .then(function(ra){
        return ra.add(rampAsset);
    })
    .then(function(){
        return getParticipantRegistry(NS+'.RampAgency')
    })
    .then(function(rAgency){
        return rAgency.update(user);
    })
}


/**
 * Taking orders from customers
 * @param {org.ctbs.RequestContainer} requestContainer
 * @transaction
 */
function requestContainer(request){
    //decideRoute(500034,600089)
    var factory = getFactory();
    var customer = getCurrentParticipant();
    var NS = "org.ctbs";
    var ctID = customer.name.substr(customer.name.length - 3)+'_'+request.pickUp_Address.ZipCode.substr(request.pickUp_Address.ZipCode.length - 2)+""+request.dropping_Address.ZipCode.substr(request.dropping_Address.ZipCode.length - 2)+"_"+request.cargo_weight
    var container_tracking_asset = factory.newResource(NS,"Container_Tracking",ctID);
    container_tracking_asset.OrderedBy = customer;
    container_tracking_asset.Cargo_weight = request.cargo_weight;
    container_tracking_asset.PickUp_Address = request.pickUp_Address;
    container_tracking_asset.Dropping_Address = request.dropping_Address;
    var cta;
    var containerAsset;
    var truckAssigned;
    return getAssetRegistry(NS+'.Container_Tracking')
    .then(function(ctar){
        cta = ctar
        return query('ContainerForCargo',{'Max_Cargo_Capacity':request.cargo_weight})
    })
    .then(function(container){
        if(container == [] || container == null || container == ""){
            throw new Error("No container found for the cargo Capacity"+container[0]);
        }
        containerAsset = container[0];
        container_tracking_asset.Container_Assigned = container[0];
        return query('TruckForContainer',{'container_width':container[0].Dimensions.width,'container_length':container[0].Dimensions.length})
    })    
    .then(function(truck){
        if(truck == [] || truck == null || truck == ""){
            throw new Error("No truck found for the Container Dimensions"+truck[0]);
        }
        truckAssigned = truck[0];
        var truckDetails = factory.newConcept(NS,'Transit_Logs');
        truckDetails.truck_assigned = truck[0];
        truckDetails.container_Status = "ASSIGNED";
        container_tracking_asset.Current_Status = truckDetails;
        container_tracking_asset.transit_logs=[];
        container_tracking_asset.transit_logs.push(truckDetails);
        //return cta.add(container_tracking_asset)
        return getAssetRegistry(NS+'.Truck')
    })
    .then(function(ta){
        truckAssigned.status = "ASSIGNED_CONTAINER";
        var tripDetails = factory.newConcept(NS,'TripDetails');
        tripDetails.container = containerAsset;
        tripDetails.Container_pickup_point = containerAsset.current_location;
        tripDetails.Cargo_pickup_point = container_tracking_asset.PickUp_Address;
        tripDetails.Cargo_dropping_point = container_tracking_asset.Dropping_Address;
        truckAssigned.Current_TripDetails = tripDetails;
        if(!truckAssigned.All_Trips){
            truckAssigned.All_Trips = [];
        }  
        truckAssigned.All_Trips.push(tripDetails); 
        return ta.update(truckAssigned)
    })
    .then(function(){
        return getAssetRegistry(NS+'.Container')
    })
    .then(function(ca){
        containerAsset.Status = "ASSIGNED";
        containerAsset.Current_Transit = container_tracking_asset;
        if(!containerAsset.Container_Transit_Logs){
            containerAsset.Container_Transit_Logs = []
        }
        containerAsset.Container_Transit_Logs.push(container_tracking_asset)
        return ca.update(containerAsset);
    })
    .then(function(){
        return cta.add(container_tracking_asset);
    })
}

/*
function decideRoute(origin,destination){
    var route = []
    var cl1 = [510010,510020,510030]
    var cl2 = [610123,610020,610321]
    var rl1 = [520089,520123,520023]
    var rl2 = [620123,620056,620010]
    var routeId = Math.floor(Math.random() * 3);
    var routeId2 = routeId;
    for(var i=0;routeId == routeId2;i++){
        routeId2 = Math.floor(Math.random() * 3);
    }
    if(origin < 600000){
        route.push(rl1[routeId-1]);
    }else{
        route.push(rl2[routeId-1]);
    }
    if(destination < 600000){
        route.push(rl1[routeId2-1]);
        route.push(cl1[routeId2-1]);
    }else{
        route.push(rl2[routeId2-1])
        route.push(cl2[routeId2-1]);
    }
    throw new Error(route[0]+"->"+route[1]+"->"+route[2])
    
}*/