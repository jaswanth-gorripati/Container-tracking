# org.ctbs
composer-rest-server -c admin@ctbs -n never -w true

{
  "$class": "org.ctbs.RequestContainer",
  "pickUp_Address": {
    "$class": "org.ctbs.Address",
    "Street": "hillroad",
    "City": "hilltop",
    "Provision": "ontario",
    "ZipCode": "9841"
  },
  "dropping_Address": {
    "$class": "org.ctbs.Address",
    "Street": "downroad",
    "City": "jik",
    "Provision": "iyug",
    "ZipCode": "78945"
  },
  "cargo_weight": 30
}

{
  "$class": "org.ctbs.Truck",
  "regNo": "ms34ju5676",
  "driver": {
    "$class": "org.ctbs.Driver",
    "name": "qwery",
    "licence_Number": "lig7754",
    "cell_number": "9954846151"
  },
  "trailer": {
    "$class": "org.ctbs.Trailer",
    "Type": "OPEN_TOP",
    "width": 20,
    "length": 40
  },
  "current_location": {
    "$class": "org.ctbs.Address",
    "Street": "hill road",
    "City": "ontario",
    "Provision": "ontario",
    "ZipCode": "654984"
  },
  "status": "IN_HALT"
}


{
  "$class": "org.ctbs.Add_Container",
  "container_details": {
    "$class": "org.ctbs.Container_details",
    "container_id": "co1",
    "Size": 40,
    "Type": "HighCube",
    "Material": "Aluminum",
    "Outside_Height": 20,
    "Tare_Weight": 3000,
    "Max_Cargo_Capacity": 1000,
    "Door_Opening": {
      "$class": "org.ctbs.Door_Opening",
      "width": 15,
      "height": 20
    },
    "Dimensions": {
      "$class": "org.ctbs.Dimensions",
      "width": 15,
      "height": 20,
      "length": 30
    },
    "current_location": {
      "$class": "org.ctbs.Address",
      "Street": "hill road",
      "City": "ontario",
      "Provision": "ontario",
      "ZipCode": "684565"
    }
  }
}