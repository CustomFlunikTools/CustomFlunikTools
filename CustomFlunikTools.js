// ==UserScript==
// @name        C&C Tiberium Alliances Flunik Tools: Custom AutoUpgrade
// @namespace   AutoUpgrade
// @description Only uses the AutoUpgrade Feature For C&C Tiberium Alliances
// @include     http*://prodgame*.alliances.commandandconquer.com/*/index.aspx*
// @author      Flunik dbendure RobertT KRS_L
// @version     20130217b
// ==/UserScript==

/*
If CY is less than level 25 upgrade CY (max build sites in base)
If CC < Base level upgrade CC
If Offence Level = CC level upgrade CC
If DHQ < Base level upgrade DHQ
If DHQ < CC upgrade DHQ
If DF < DHQ upgrade DF
If support < DHQ upgrade support
If Airport/Barracks/Vehicles < CC level upgrade repair building
(Version A) If cost of upgrade of any of the main buildings exceeds silo capacity upgrade silos 
(Version B) If rate of production would cause silos full in less than 24 hours upgrade silos
(Version A) Upgrade lowest level normal building 
(Version B) Try and determine what building will give greatest benefit to resource production and upgrade it
*/


(function () {
	var FlunikTools_main = function () {
		try {
			function CCTAWrapperIsInstalled() {
				return (typeof (CCTAWrapper_IsInstalled) != 'undefined' && CCTAWrapper_IsInstalled);
			}

			function createFlunikTools() {
				console.log('Custom FLUNIKTOLS createFlunikTools');

				qx.Class.define("FlunikTools.Main", {
					type: "singleton",
					extend: qx.core.Object,
					members: {
						AutoUpdateButton: null,
						autoUpdateHandle: null,
						buildingsToUpdate: null,

						initialize: function () {

							console.log('Custom FLUNIKTOLS initialize');
							AutoUpdateButton = new qx.ui.form.Button("AutoUpgrade", null).set({
								toolTipText: "Flunik",
								width: 100,
								height: 40,
								maxWidth: 100,
								maxHeight: 40,
								appearance: ("button-playarea-mode-frame"), //"button-standard-"+factionText), button-playarea-mode-red-frame
								center: true
							});

							AutoUpdateButton.addListener("click", function (e) {
								if (window.FlunikTools.Main.getInstance().autoUpdateHandle != null) {
									window.FlunikTools.Main.getInstance().stopAutoUpdate();
									AutoUpdateButton.setLabel("Flunik OFF");
									//alert("Stopped auto-update");
								} else {
									//window.FlunikTools.Main.getInstance().startAutoUpdate("Silo,Command Center");
									window.FlunikTools.Main.getInstance().startAutoUpdate("Construction Yard, Command Center, Defense HQ, Defense Facility, Barracks, Factory, Airfield, Accumulator, Silo, Refinery, Power Plant");
									AutoUpdateButton.setLabel("Flunik ON");
									//alert("Started auto-update");
								}
							}, this);

							var app = qx.core.Init.getApplication();

							app.getDesktop().add(AutoUpdateButton, {
								right: 120,
								bottom: 80
							});

						},

						 get_IsFull: function (city, type) {
							if (city.GetResourceCount(type) < city.GetResourceMaxStorage(type)) {
								return false;
							} else {
								return true;
							}
						},

						startAutoUpdate: function (_buildingsToUpdate) {
							if (_buildingsToUpdate == 'undefined' || _buildingsToUpdate != null) {
								_buildingsToUpdate == "Construction Yard, Command Center, Defense HQ, Defense Facility, Barracks, Factory, Airfield, Accumulator, Silo, Refinery, Power Plant";
							}
							this.buildingsToUpdate = _buildingsToUpdate;
							this.autoUpgrade();
							this.autoUpdateHandle = window.setInterval(this.autoUpgrade, 60000);
						},
						
						stopAutoUpdate: function () {
							window.clearInterval(this.autoUpdateHandle);
							this.autoUpdateHandle = null;
						},

						autoUpgrade: function () {
							for (var nCity in ClientLib.Data.MainData.GetInstance().get_Cities().get_AllCities().d) {
								var city = ClientLib.Data.MainData.GetInstance().get_Cities().get_AllCities().d[nCity];
								var cityname = city.get_Name();
								var baselvl = city.get_LvlBase();
								var buildings = city.get_Buildings();
								var lowestbuildinglevel = 999;
								var lowestdefencelevel = 999;
								var lowestoffencelevel = 999;
								console.debug("FLUNIK: ----------- Analyzing city %d with level %d", cityname, baselvl);


								//get_IsFull(city, ClientLib.Base.EResourceType.Crystal);

								// or
								// get_IsFull(city, ClientLib.Base.EResourceType.Tiberium);

								var units = city.get_CityUnitsData();
								var offenceUnits = units.get_OffenseUnits();
								for (var nUnit in offenceUnits.d) {
									var unit = offenceUnits.d[nUnit];
									var unitlvl = unit.get_CurrentLevel();
									var unit_obj = {
											cityid: city.get_Id(),
											unitId: unit.get_Id()
									};


									if (unitlvl<lowestoffencelevel && unit.CanUpgrade()) {
										var lowestoffencelevel=unitlvl;
										var lowestoffenceunit_obj=unit_obj;
									};
								};
								if (lowestoffencelevel==999) {
									console.debug("FLUNIK: The offence units are maxed out at level: %d", unitlvl);
									lowestoffencelevel=unitlvl;
								} else {
									console.debug("FLUNIK: Upgrading %d offence unit from level of: %d", unit, unitlvl);
									ClientLib.Net.CommunicationManager.GetInstance().SendCommand("UnitUpgrade", lowestoffenceunit_obj, null, null, true);
								}

								var defenceUnits = units.get_DefenseUnits();
								for (var nUnit in defenceUnits.d) {
									var unit = defenceUnits.d[nUnit];
									var unitlvl = unit.get_CurrentLevel();
									var unit_obj = {
											cityid: city.get_Id(),
											unitId: unit.get_Id()
									};

									if (unitlvl<lowestdefencelevel && unit.CanUpgrade()) {
										var lowestdefencelevel=unitlvl;
										var lowestdefenceunit_obj=unit_obj;
									};
								};
								if (lowestdefencelevel==999) {
									console.debug("FLUNIK: The defence units are maxed out at level: %d", unitlvl);
									lowestdefencelevel=unitlvl;
								} else {
									console.debug("FLUNIK: Upgrading %d defence unit from level of: %d", unit, unitlvl);
									ClientLib.Net.CommunicationManager.GetInstance().SendCommand("UnitUpgrade", lowestdefenceunit_obj, null, null, true);
								}

								for (var nBuildings in buildings.d) {
									var building = buildings.d[nBuildings];
									var name = building.get_UnitGameData_Obj().dn;
									var buildinglvl = building.get_CurrentLevel();
									var building_obj = {
											cityid: city.get_Id(),
											buildingid: building.get_Id(),
											posX: building.get_CoordX(),
											posY: building.get_CoordY(),
											isPaid: true
									};

									//console.debug("The %d building has a level of: %d", name, buildinglvl);

									if 	(name == "Construction Yard") {
										var CY=building;
										continue;
									};            
									if 	(name == "Command Center") {
										var CC=building;
										continue;
									};            
									if 	(name == "Defense HQ") {
										var DHQ=building;
										continue;
									};            
									if 	(name == "Defense Facility") {
										var DF=building;
										continue;
									};            
									if 	(name == "Falcon Support" || name == "Ion Cannon Support" || name == "Skystrike Support" ||
											name == "Blade of Kane" || name == "Eye of Kane" || name == "Fist of Kane" ) {
										var SUPPORT=building;
										continue;
									};            
									if 	(name == "Barracks") {
										var INF=building;
										continue;
									};            
									if 	(name == "Factory") {
										var VEH=building;
										continue;
									};            
									if 	(name == "Airfield") {
										var AIR=building;
										continue;
									};            
									//console.debug("FLUNIK: The %d building has a level of: %d", name, buildinglvl);
									if	(buildinglvl < lowestbuildinglevel && building.CanUpgrade())	{
										var lowestbuildinglevel=buildinglvl;
										var lowestbuilding=building;
										var lowestbuildingname=name;
									};
								}; // for buildings 

								// get_IsFull(city, ClientLib.Base.EResourceType.Crystal);
								// or
// broken on 2nd pass?			var tiberiumisfull = this.get_IsFull(city, ClientLib.Base.EResourceType.Tiberium);
								var tiberiumisfull = FlunikTools.Main.prototype.get_IsFull(city, ClientLib.Base.EResourceType.Tiberium);
								var crystalisfull = FlunikTools.Main.prototype.get_IsFull(city, ClientLib.Base.EResourceType.Crystal);
								console.debug("FLUNIK: Crystal current %d max %d",city.GetResourceCount(ClientLib.Base.EResourceType.Crystal),city.GetResourceMaxStorage(ClientLib.Base.EResourceType.Crystal));
								console.debug("FLUNIK: Tiberium current %d max %d",city.GetResourceCount(ClientLib.Base.EResourceType.Tiberium),city.GetResourceMaxStorage(ClientLib.Base.EResourceType.Tiberium));
								
								if (!tiberiumisfull) {

									if (crystalisfull) {
										console.debug("FLUNIK: Crystal is full - attempting CC and DHQ upgrades if useful");
										if (CC.get_CurrentLevel() == lowestoffencelevel && crystalisfull && CC.CanUpgrade()) {
											console.debug("FLUNIK: Crystal is full - Upgrading CC since offencelevel is maximum");
											CC.Upgrade();
											return;
											continue;
										};

										if (DHQ.get_CurrentLevel() == lowestdefencelevel && crystalisfull && DHQ.CanUpgrade()) {
											console.debug("FLUNIK: Crystal is full - Upgrading DHQ since defencelevel is maximum");
											DHQ.Upgrade();
											return;
											continue;
										};
									}
									console.debug("FLUNIK: Tiberium is not full - waiting for full - Current %d max %d",city.GetResourceCount(ClientLib.Base.EResourceType.Tiberium),city.GetResourceMaxStorage(ClientLib.Base.EResourceType.Tiberium));
									continue;
								}
								
								if (CY.get_CurrentLevel() < 25) {
									if (CY.CanUpgrade()) {
										console.debug("FLUNIK: The CY building level %d is lower than 25 - Upgrading", CY.get_CurrentLevel());
										CY.Upgrade();
										return;
										continue;
									} else {
										console.debug("FLUNIK: The CY building level %d is lower than 25 but city is full - skipping to next", CY.get_CurrentLevel());
									};
								};

								if (CC.get_CurrentLevel() < baselvl) {
									if (CC.CanUpgrade()) {
										console.debug("FLUNIK: The CC building level %d is lower than base level %d - Upgrading", CC.get_CurrentLevel(), baselvl);
										CC.Upgrade();
										return;
										continue;
									} else {
										console.debug("FLUNIK: The CC building level %d is lower than base level %d but city is full - skipping to next", CC.get_CurrentLevel(), baselvl);
									};
								};

								if (CC.get_CurrentLevel() == lowestoffencelevel) {
									if (CC.CanUpgrade()) {
										console.debug("FLUNIK: The CC building level %d matches lowest offence level %d - Upgrading", CC.get_CurrentLevel(), lowestoffencelevel);
										CC.Upgrade();
										return;
										continue;
									} else {
										console.debug("FLUNIK: The CC building level %d matches lowest offence level %d but city is full - skipping to next", CC.get_CurrentLevel(), lowestoffencelevel);
									};
								};

								if (DHQ.get_CurrentLevel() < baselvl) {
									if (DHQ.CanUpgrade()) {
										console.debug("FLUNIK: The DHQ building level %d is lower than base level %d - Upgrading", DHQ.get_CurrentLevel(), baselvl);
										DHQ.Upgrade();
										return;
										continue;
									} else {
										console.debug("FLUNIK: The DHQ building level %d is lower than base level %d but city is full - skipping to next", DHQ.get_CurrentLevel(), baselvl);
									};
								};

								if (DHQ.get_CurrentLevel() == lowestdefencelevel) {
									if (DHQ.CanUpgrade()) {
										console.debug("FLUNIK: The DHQ building level %d matches lowest defence level %d - Upgrading", DHQ.get_CurrentLevel(), lowestoffencelevel);
										DHQ.Upgrade();
										return;
										continue;
									} else {
										console.debug("FLUNIK: The DHQ building level %d matches lowest defence level %d but city is full - skipping to next", DHQ.get_CurrentLevel(), lowestoffencelevel);
									};
								};

								if (DF.get_CurrentLevel() < DHQ.get_CurrentLevel()) {
									if (DF.CanUpgrade()) {
										console.debug("FLUNIK: The DF building level %d is lower than DHQ level %d - Upgrading", DF.get_CurrentLevel(), DHQ.get_CurrentLevel());
										DF.Upgrade();
										return;
										continue;
									} else {
										console.debug("FLUNIK: The DF building level %d is lower than DHQ level %d but city is full - skipping to next", DF.get_CurrentLevel(), DHQ.get_CurrentLevel());
									};
								};

								if (SUPPORT.get_CurrentLevel() < DHQ.get_CurrentLevel()) {
									if (DF.CanUpgrade()) {
										console.debug("FLUNIK: The SUPPORT building level %d is lower than DHQ level %d - Upgrading", SUPPORT.get_CurrentLevel(), DHQ.get_CurrentLevel());
										SUPPORT.Upgrade();
										return;
										continue;
									} else {
										console.debug("FLUNIK: The SUPPORT building level %d is lower than DHQ level %d but city is full - skipping to next", SUPPORT.get_CurrentLevel(), DHQ.get_CurrentLevel());
									};
								};

								var airRT = city.get_CityUnitsData().GetRepairTimeFromEUnitGroup(ClientLib.Data.EUnitGroup.Aircraft, false);
								var vehRT = city.get_CityUnitsData().GetRepairTimeFromEUnitGroup(ClientLib.Data.EUnitGroup.Vehicle, false);
								var infRT = city.get_CityUnitsData().GetRepairTimeFromEUnitGroup(ClientLib.Data.EUnitGroup.Infantry, false);
								var maxRT = Math.max(airRT,vehRT,infRT);
								console.debug("FLUNIK: Support info: Max %d AIR %d VEH %d INF %d", maxRT, airRT, vehRT, infRT);
								
								if (maxRT>4) { // No point upgrading unless RT > 4
									switch (maxRT) {
									case airRT:
										// Air has highest RT
										if (AIR.CanUpgrade()) {
											console.debug("FLUNIK: The Airport level %d has repair time of %d - Upgrading", AIR.get_CurrentLevel(), airRT);
											AIR.Upgrade();
											return;
											continue;
										} else {
											console.debug("FLUNIK: The Airport level %d has repair time %d but city is full - skipping to next", AIR.get_CurrentLevel(), airRT);
										};
										break;
									case vehRT:
										// Vehicle has highest RT
										if (VEH.CanUpgrade()) {
											console.debug("FLUNIK: The Vehicle level %d has repair time of %d - Upgrading", VEH.get_CurrentLevel(), vehRT);
											VEH.Upgrade();
											return;
											continue;
										} else {
											console.debug("FLUNIK: The Vehicle level %d has repair time %d but city is full - skipping to next", VEH.get_CurrentLevel(), vehRT);
										};
										break;
									case infRT:
										// Infantry has highest RT
										if (INF.CanUpgrade()) {
											console.debug("FLUNIK: The Infantry level %d has repair time of %d - Upgrading", INF.get_CurrentLevel(), infRT);
											INF.Upgrade();
											return;
											continue;
										} else {
											console.debug("FLUNIK: The Infantry level %d has repair time %d but city is full - skipping to next", INF.get_CurrentLevel(), infRT);
										};
										break;
									};
								};

								if (lowestbuilding.CanUpgrade()) {
									console.debug("FLUNIK: Default upgrade - lowest building is %d level %d", lowestbuildingname, lowestbuildinglevel);
									lowestbuilding.Upgrade();
									return;
								}
								
							}; // for city
						} // function autoupgrade
					} // members
				}); // class define
			} // create fluniktools
		} catch (e) {
			console.log("createFlunikTools: ", e);
		} // end try catch

		function FlunikTools_checkIfLoaded() {
			try {
				if (typeof qx != 'undefined' && qx.core.Init.getApplication() && qx.core.Init.getApplication().getUIItem(ClientLib.Data.Missions.PATH.BAR_NAVIGATION) && qx.core.Init.getApplication().getUIItem(ClientLib.Data.Missions.PATH.BAR_NAVIGATION).isVisible()) {
					createFlunikTools();

					for (var key in ClientLib.Data.CityBuilding.prototype) { //KRS_L
						if (ClientLib.Data.CityBuilding.prototype[key] !== null) {
							var strFunction = ClientLib.Data.CityBuilding.prototype[key].toString();
							if (typeof ClientLib.Data.CityBuilding.prototype[key] === 'function' & strFunction.indexOf("true).l.length==0)){return true;}}return false") > -1) {
								ClientLib.Data.CityBuilding.prototype.CanUpgrade = ClientLib.Data.CityBuilding.prototype[key];
								break;
							}
						}
					}

					for (var key in ClientLib.Data.CityUnit.prototype) { //KRS_L
						if (ClientLib.Data.CityUnit.prototype[key] !== null) {
							var strFunction = ClientLib.Data.CityUnit.prototype[key].toString();
							if (typeof ClientLib.Data.CityUnit.prototype[key] === 'function' & strFunction.indexOf(".l.length>0)){return false;}") > -1) {
								ClientLib.Data.CityUnit.prototype.CanUpgrade = ClientLib.Data.CityUnit.prototype[key];
								break;
							}
						}
					}

					for (var key in ClientLib.Data.CityBuilding.prototype) {
						if (typeof ClientLib.Data.CityBuilding.prototype[key] === 'function') {
							var strFunction = ClientLib.Data.CityBuilding.prototype[key].toString();
							if (strFunction.indexOf("()+1);this.") > -1) {
								ClientLib.Data.CityBuilding.prototype.Upgrade = ClientLib.Data.CityBuilding.prototype[key];
								break;
							}
						}
					}



					window.FlunikTools.Main.getInstance().initialize();
				} else {
					window.setTimeout(FlunikTools_checkIfLoaded, 1000);
				}
			} catch (e) {
				console.log("FlunikTools_checkIfLoaded: ", e);
			}
		}
		if (/commandandconquer\.com/i.test(document.domain)) {
			window.setTimeout(FlunikTools_checkIfLoaded, 1000);
		}
	}; // FlunikTools_main function

	try {
		var FlunikScript = document.createElement("script");
		FlunikScript.innerHTML = "(" + FlunikTools_main.toString() + ")();";
		FlunikScript.type = "text/javascript";
		if (/commandandconquer\.com/i.test(document.domain)) {
			document.getElementsByTagName("head")[0].appendChild(FlunikScript);
		}
	} catch (e) {
		console.log("FlunikTools: init error: ", e);
	}
})();