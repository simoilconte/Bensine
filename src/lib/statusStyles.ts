type PartRequestStatus = "DA_ORDINARE" | "ORDINATO" | "ARRIVATO" | "CONSEGNATO" | "ANNULLATO"

export function getPartRequestBadgeClass(status: PartRequestStatus): string {
  const classes = {
    DA_ORDINARE: "badge-da-ordinare",
    ORDINATO: "badge-ordinato",
    ARRIVATO: "badge-arrivato",
    CONSEGNATO: "badge-consegnato",
    ANNULLATO: "badge-annullato",
  }
  return classes[status] || "badge-da-ordinare"
}

export function getPartRequestLabel(status: PartRequestStatus): string {
  const labels = {
    DA_ORDINARE: "Da Ordinare",
    ORDINATO: "Ordinato",
    ARRIVATO: "Arrivato",
    CONSEGNATO: "Consegnato",
    ANNULLATO: "Annullato",
  }
  return labels[status] || status
}
