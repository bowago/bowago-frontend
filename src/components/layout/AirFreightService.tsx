// components/AirFreightService.jsx
import React from "react";
import {
  Clock,
  Globe,
  Package,
  Plane,
  Zap,
  Shield,
  Heart,
  Truck,
  Microchip,
  Pill,
  FileText,
  Apple,
  Shirt,
  Car,
  Gem,
  Dog,
} from "lucide-react";

const AirFreightService = () => {
  const metrics = [
    {
      icon: Clock,
      value: "10-20h",
      label: "Avg. Transit Time",
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      icon: Globe,
      value: "10+",
      label: "Country of Coverage",
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      icon: Package,
      value: "8+",
      label: "Shipment Categories",
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
  ];

  const categories = [
    { name: "Electronics & Technology", icon: Microchip },
    { name: "Pharmaceuticals & Medical Supplies", icon: Pill },
    { name: "Documents & Small Parcels", icon: FileText },
    { name: "Perishable goods", icon: Apple },
    { name: "Fashion & Apparel", icon: Shirt },
    { name: "Automotive & Machinery Parts", icon: Car },
    { name: "High Value & Precious Items", icon: Gem },
    { name: "Pets", icon: Dog },
  ];

  const features = [
    { icon: Zap, text: "Fast & Reliable Delivery" },
    { icon: Shield, text: "Secure Handling" },
    { icon: Truck, text: "Door-to-Door Service" },
    { icon: Heart, text: "Special Care for Sensitive Items" },
  ];

  return (
    <div className=" ">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Content */}
        <div className="relative ">
          <div className="flex flex-col items-center text-center bg-blue-50 py-10 mb-10">
            <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm font-medium mb-8">
              <Plane className="w-4 h-4 mr-2" />
              Premium Air Freight Solutions
            </div>

            <h1 className="text-5xl md:text-6xl font-bold  mb-6 tracking-tight">
              Air Freight
            </h1>

            <p className="text-xl max-w-3xl mx-auto leading-relaxed">
              Fast and reliable method of transporting goods by aircraft,
              connecting businesses and markets across the world.
            </p>
          </div>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className=" relative z-10 w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {metrics.map((metric, index) => {
            const Icon = metric.icon;
            return (
              <div
                key={index}
                className="bg-white rounded-2xl shadow-xl p-8 transform hover:scale-105 transition-all duration-300 hover:shadow-2xl"
              >
                <div
                  className={`inline-flex p-4 rounded-xl ${metric.bgColor} mb-4`}
                >
                  <Icon className={`w-8 h-8 ${metric.color}`} />
                </div>
                <div className="text-4xl font-bold text-gray-900 mb-2">
                  {metric.value}
                </div>
                <div className="text-lg text-gray-600">{metric.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <div className="py-10 mt-4  w-10/12">
        <div>
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6 leading-tight">
              Fast, Secure, and
              <br />
              Global Air Freight Services
            </h2>
            <p className="text-base text-gray-600 leading-relaxed mb-4">
              Air freight service is a fast and reliable method of transporting
              goods by aircraft from one location to another, typically used for
              time-sensitive, high-value, or perishable shipments. It connects
              businesses and markets across the world by enabling rapid
              international and domestic delivery. This service is widely used
              in industries such as e-commerce, pharmaceuticals, electronics,
              automotive parts, and fresh food distribution.
            </p>
            <p className="text-base text-gray-600 leading-relaxed mb-4">
              Air freight providers manage the entire shipping process,
              including cargo handling, packaging requirements, customs
              documentation, and coordination with airlines and airports.
              Shipments are transported through cargo aircraft or in the cargo
              hold of passenger planes, ensuring that goods reach their
              destinations quickly and securely.
            </p>

            {/* Features Grid */}
            <div className="grid grid-cols-2 gap-4 mt-8">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="p-2 bg-blue-50 rounded-lg">
                        <Icon className="w-5 h-5 text-blue-600" />
                      </div>
                    </div>
                    <span className="text-gray-700 font-medium">
                      {feature.text}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Categories Section */}
        <div className="py-10 mt-4">
          <div className=" mb-4">
            <h2 className="text-3xl font-bold text-gray-900 ">
              Shipment Categories
            </h2>
            <p className="text-base text-gray-600  mt-3">
              We handle a wide range of shipments with specialized care and
              expertise
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((category, index) => {
              const Icon = category.icon;
              return (
                <div
                  key={index}
                  className="group bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-blue-200"
                >
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                      <Icon className="w-6 h-6 text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {category.name}
                    </h3>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AirFreightService;
