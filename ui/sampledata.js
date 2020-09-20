const julian = gun.get('julian').put({label: "Julian", firstname: "Julian", lastname: "Bee"})
const robert = gun.get("robert").put({ label: "Robby", firstname: "Robert", lastname: "Löbelt" })
const till = gun.get("till").put({ label: "Tilly", firstname: "Till", lastname: "Wipperfürth" })
const michel = gun.get("michel").put({ label: "Michel", firstname: "Michael", lastname: "Herpig" })
const gesa = gun.get("gesa").put({ label: "Gesalein", firstname: "Gesa", lastname: "Rafflenbeul" })

julian.get(':knows').set(robert)
julian.get(':knows').set(till)
julian.get(':knows').set(michel)
julian.get(':knows').set(gesa)

gesa.get(':knows').set(julian)
gesa.get(':knows').set(robert)
gesa.get(':knows').set(till)
gesa.get(':knows').set(michel)

robert.get(':knows').set(till)
robert.get(':knows').set(gesa)

till.get(':knows').set(robert)
till.get(':knows').set(michel)
till.get(':knows').set(gesa)

michel.get(':knows').set(till)
michel.get(':knows').set(gesa)



