export type Country = {
  iso: string;
  name: string;
  dial: string;
};

export const countries: Country[] = [
  { iso: "DZ", name: "Algeria", dial: "+213" },
  { iso: "AU", name: "Australia", dial: "+61" },
  { iso: "BH", name: "Bahrain", dial: "+973" },
  { iso: "BD", name: "Bangladesh", dial: "+880" },
  { iso: "BR", name: "Brazil", dial: "+55" },
  { iso: "CA", name: "Canada", dial: "+1" },
  { iso: "CN", name: "China", dial: "+86" },
  { iso: "EG", name: "Egypt", dial: "+20" },
  { iso: "FR", name: "France", dial: "+33" },
  { iso: "DE", name: "Germany", dial: "+49" },
  { iso: "GH", name: "Ghana", dial: "+233" },
  { iso: "HK", name: "Hong Kong", dial: "+852" },
  { iso: "IN", name: "India", dial: "+91" },
  { iso: "ID", name: "Indonesia", dial: "+62" },
  { iso: "IQ", name: "Iraq", dial: "+964" },
  { iso: "IT", name: "Italy", dial: "+39" },
  { iso: "JP", name: "Japan", dial: "+81" },
  { iso: "JO", name: "Jordan", dial: "+962" },
  { iso: "KE", name: "Kenya", dial: "+254" },
  { iso: "KW", name: "Kuwait", dial: "+965" },
  { iso: "LB", name: "Lebanon", dial: "+961" },
  { iso: "MA", name: "Morocco", dial: "+212" },
  { iso: "NP", name: "Nepal", dial: "+977" },
  { iso: "NL", name: "Netherlands", dial: "+31" },
  { iso: "NG", name: "Nigeria", dial: "+234" },
  { iso: "OM", name: "Oman", dial: "+968" },
  { iso: "PK", name: "Pakistan", dial: "+92" },
  { iso: "PS", name: "Palestine", dial: "+970" },
  { iso: "PH", name: "Philippines", dial: "+63" },
  { iso: "QA", name: "Qatar", dial: "+974" },
  { iso: "SA", name: "Saudi Arabia", dial: "+966" },
  { iso: "SG", name: "Singapore", dial: "+65" },
  { iso: "ZA", name: "South Africa", dial: "+27" },
  { iso: "KR", name: "South Korea", dial: "+82" },
  { iso: "ES", name: "Spain", dial: "+34" },
  { iso: "LK", name: "Sri Lanka", dial: "+94" },
  { iso: "CH", name: "Switzerland", dial: "+41" },
  { iso: "SY", name: "Syria", dial: "+963" },
  { iso: "TH", name: "Thailand", dial: "+66" },
  { iso: "TN", name: "Tunisia", dial: "+216" },
  { iso: "TR", name: "Turkey", dial: "+90" },
  { iso: "AE", name: "United Arab Emirates", dial: "+971" },
  { iso: "GB", name: "United Kingdom", dial: "+44" },
  { iso: "US", name: "United States", dial: "+1" },
  { iso: "VN", name: "Vietnam", dial: "+84" },
];

export function findCountry(iso: string) {
  return countries.find((c) => c.iso === iso);
}

export function toE164(iso: string, nationalNumber: string) {
  const country = findCountry(iso);
  const digits = nationalNumber.replace(/[^\d]/g, "");
  if (!country || !digits) return "";
  return `${country.dial}${digits}`;
}
