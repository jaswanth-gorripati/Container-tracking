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
    var NS = "org.ctbs";
    var containerAsset = factory.newResource(NS,'Container',containerDetails.container_details.container_id);
    containerAsset.Size = containerDetails.container_details.Size
    containerAsset.Type = containerDetails.container_details.Type
    containerAsset.Material = containerDetails.container_details.Material
    containerAsset.Outside_Height = containerDetails.container_details.Outside_Height
    containerAsset.Tare_Weight = containerDetails.container_details.Tare_Weight
    containerAsset.Max_Cargo_Capacity = containerDetails.container_details.Max_Cargo_Capacity
    containerAsset.Door_Opening = containerDetails.container_details.Door_Opening
    containerAsset.Interior_Dimensions = containerDetails.container_details.Interior_Dimensions
    containerAsset.current_location = containerDetails.container_details.current_location
    containerAsset.Status = "NOT_ASSIGNED";
    containerAsset.Cargo_status ="EMPTY";
    var AddingContainerEvent = factory.newEvent(NS,'Adding_Container');
    AddingContainerEvent.containerID = containerAsset;
    return getAssetRegistry(NS+'.Container')
    .then(function(ca){
        return ca.add(containerAsset);
    })
}

/**
 * Taking orders from customers
 * @param {org.ctbs.RequestContainer} requestContainer
 * @transaction
 */

function requestContainer(request){
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
            throw new Error("No container found for the cargo Capacity"+container);
        }
        containerAsset = container[0];
        container_tracking_asset.Container_Assigned = container;
        return query('TruckForContainer',{'container_width':container.Dimensions.width,'container_length':container.Dimensions.length})
    })    
    .then(function(truck){
        if(truck == [] || truck == null || truck == ""){
            throw new Error("No truck found for the Container Dimensions"+truck);
        }
        truckAssigned = truck[0];
        var truckDetails = factory.newConcept(NS,'Transit_Logs');
        truckDetails.truck_assigned = truck[0];
        truckDetails.container_Status = "EMPTY"
        container_tracking_asset.Current_Status = truckDetails;
        container_tracking_asset.transit_logs=[];
        container_tracking_asset.transit_logs.push(truckDetails);
        //return cta.add(container_tracking_asset)
        return getAssetRegistry
    })
}