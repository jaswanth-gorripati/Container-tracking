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

/**
 * Setting up requried participants and assets from customers
 * @param {org.ctbs.setupDemo} setupDemo
 * @transaction
 */
function setupDemo(details){
    var factory = getFactory();
    var NS = "org.ctbs";
    // Container Agency 
    var cnAgency = factory.newResource(NS,'ContainerAgency',"ca3");
    cnAgency.agencyName = "Cn Agency pvt ltd"
    cnAgency.Located_in_city = "San Francisco";

    // Truck Agency
    var taAgency = factory.newResource(NS,'TruckAgency',"ta3");
    taAgency.agencyName = "Truck supply pvt ltd"
    taAgency.Located_in_city = "New york";

    // Ramp Agency 
    var raAgency = factory.newResource(NS,'RampAgency',"ra3");
    raAgency.agencyName = "Rapon Ramp pvt ltd"
    raAgency.Located_in_city = "Yorkshire";

    // Containers 
    var container1 = factory.newResource(NS,'Container',"container3");
    container1.ownedByAgency = cnAgency;
    container1.Size = 30
    container1.Type = "HighCube"
    container1.Material = "Aluminum"
    container1.Outside_Height = 60
    container1.Tare_Weight = 3200
    container1.Max_Cargo_Capacity = 500

    var dooropening = factory.newConcept(NS,'Door_Opening');
    dooropening.width = 10;
    dooropening.height = 30;

    var dimensions = factory.newConcept(NS,'Dimensions');
    dimensions.width = 10;
    dimensions.height = 30;
    dimensions.length = 50

    var current_location = factory.newConcept(NS,'Address');
    current_location.Street = "hill top";
    current_location.City = "New jersey";
    current_location.Provision = "Alberta"
    current_location.ZipCode = 510278;

    container1.Door_Opening = dooropening
    container1.Dimensions = dimensions
    container1.current_location = current_location
    container1.Status = "NOT_ASSIGNED";
    container1.container_Cargo_status ="EMPTY";
    container1.Avilable_cargo_space = container1.Max_Cargo_Capacity;
    cnAgency.containersOwned = []
    cnAgency.containersOwned.push(container1);

    // Truck Details

    var tAsset = factory.newResource(NS,"Truck","trk3");

    var driver = factory.newConcept(NS,'Driver');
    driver.name = "sam";
    driver.licence_Number = "lic7264";
    driver.cell_number = "9160876767"

    var trailer = factory.newConcept(NS,'Trailer');
    trailer.Type = "OPEN_TOP";
    trailer.width = 20;
    trailer.length = 60;

    tAsset.ownedByAgency = taAgency;
    tAsset.driver = driver;
    tAsset.trailer = trailer;
    tAsset.current_location = current_location;
    tAsset.status = "IN_HALT";
    taAgency.trucksOwned = []
    taAgency.trucksOwned.push(tAsset);

    // RAMP 

    var rampAsset = factory.newResource(NS,"RailRamp","rmp3");
    rampAsset.ownedByAgency = raAgency;
    rampAsset.location = current_location;
    rampAsset.ramp_status = "OPEN";
    raAgency.rampsOwned = []
    raAgency.rampsOwned.push(rampAsset);

    //customer
    var customer = factory.newResource(NS,'Customer',"custmer2");
    customer.name = "dt.Devoo"
    customer.emailid = "devoo@gmail.com";
    customer.phoneno = "9834749889";
    customer.address = current_location;
    customer.address.ZipCode = 600836;

    return getParticipantRegistry(NS+'.ContainerAgency')
    .then(function(cAgency){
        return cAgency.add(cnAgency);
    })
    .then(function(){
        return getAssetRegistry(NS+'.Container')
    })
    .then(function(ca){
        container1.current_location.ZipCode = 510089
        return ca.add(container1);
    })
    .then(function(){
        return getParticipantRegistry(NS+'.TruckAgency')
    })
    .then(function(tAgency){
        return tAgency.add(taAgency);
    })
    .then(function(){
        return getAssetRegistry(NS+'.Truck')
    })
    .then(function(ta){
        tAsset.current_location.ZipCode = 500123
        return ta.add(tAsset);
    })
    .then(function(){
        return getParticipantRegistry(NS+'.RampAgency')
    })
    .then(function(rAgency){
        return rAgency.add(raAgency);
    })
    .then(function(){
        return getAssetRegistry(NS+'.RailRamp')
    })
    .then(function(ra){
        rampAsset.location.ZipCode = 520098
        return ra.add(rampAsset);
    })
    .then(function(){
        return getParticipantRegistry(NS+'.Customer')
    })
    .then(function(cma){
        return cma.add(customer);
    })
}
