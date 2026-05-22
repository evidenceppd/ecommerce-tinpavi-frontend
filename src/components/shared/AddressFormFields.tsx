export type AddressFormValues = {
  zipCode: string;
  street: string;
  number: string;
  complement: string;
  district: string;
  city: string;
  state: string;
};

type AddressFormField = keyof AddressFormValues;

type AddressLike = Partial<Record<AddressFormField, string | null>> | null | undefined;

type AddressFormFieldsProps = {
  values: AddressFormValues;
  onChange: (field: AddressFormField, value: string) => void;
  onZipCodeBlur?: (zipCode: string) => void;
  readOnly?: boolean;
  requiredFields?: AddressFormField[];
  disabledFields?: AddressFormField[];
  isFetchingCep?: boolean;
  showRequiredMarks?: boolean;
  errors?: Partial<Record<AddressFormField, string>>;
};

const fieldDefinitions: Array<{
  field: AddressFormField;
  label: string;
  className: string;
}> = [
  { field: "zipCode", label: "CEP", className: "sm:col-span-2" },
  { field: "street", label: "Rua", className: "sm:col-span-3" },
  { field: "number", label: "Numero", className: "sm:col-span-1" },
  { field: "complement", label: "Complemento", className: "sm:col-span-2" },
  { field: "district", label: "Bairro", className: "sm:col-span-2" },
  { field: "city", label: "Cidade", className: "sm:col-span-1" },
  { field: "state", label: "UF", className: "sm:col-span-1" },
];

export const emptyAddressForm: AddressFormValues = {
  zipCode: "",
  street: "",
  number: "",
  complement: "",
  district: "",
  city: "",
  state: "",
};

function normalizedValue(value: string): string {
  return value.trim();
}

export function mapAddressToForm(address: AddressLike): AddressFormValues {
  if (!address) return emptyAddressForm;
  return {
    zipCode: address.zipCode ?? "",
    street: address.street ?? "",
    number: address.number ?? "",
    complement: address.complement ?? "",
    district: address.district ?? "",
    city: address.city ?? "",
    state: address.state ?? "",
  };
}

export function hasAddressData(address: AddressFormValues): boolean {
  return Object.values(address).some((value) => normalizedValue(value).length > 0);
}

export function normalizeAddressForm(address: AddressFormValues): AddressFormValues {
  return {
    zipCode: address.zipCode.replace(/\D/g, ""),
    street: normalizedValue(address.street),
    number: normalizedValue(address.number),
    complement: normalizedValue(address.complement),
    district: normalizedValue(address.district),
    city: normalizedValue(address.city),
    state: normalizedValue(address.state).toUpperCase(),
  };
}

export function isAddressFormComplete(address: AddressFormValues): boolean {
  const normalized = normalizeAddressForm(address);
  const requiredValues = [
    normalized.zipCode,
    normalized.street,
    normalized.number,
    normalized.district,
    normalized.city,
    normalized.state,
  ];

  if (requiredValues.some((value) => value.length === 0)) return false;
  if (normalized.zipCode.length !== 8) return false;
  return normalized.state.length === 2;
}

export function formatAddressFromForm(address: AddressFormValues): string {
  const normalized = normalizeAddressForm(address);
  const streetNumber = [normalized.street, normalized.number].filter(Boolean).join(", ");
  const districtCityState = [
    normalized.district,
    [normalized.city, normalized.state].filter(Boolean).join(" - "),
  ]
    .filter(Boolean)
    .join(", ");

  return [streetNumber, normalized.complement, districtCityState, normalized.zipCode]
    .filter(Boolean)
    .join(" - ");
}

export function AddressFormFields({
  values,
  onChange,
  onZipCodeBlur,
  readOnly = false,
  requiredFields = ["zipCode", "street", "number", "district", "city", "state"],
  disabledFields = [],
  isFetchingCep = false,
  showRequiredMarks = false,
  errors,
}: AddressFormFieldsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-6">
      {fieldDefinitions.map(({ field, label, className }) => {
        const isRequired = requiredFields.includes(field);
        const isDisabled = disabledFields.includes(field);
        const fieldError = errors?.[field];

        return (
          <label key={field} className={className}>
            <span className="mb-1.5 block text-sm font-bold text-gray-800">
              {label}
              {showRequiredMarks && isRequired && <span className="ml-0.5 text-red-500">*</span>}
              {field === "zipCode" && isFetchingCep && (
                <span className="ml-2 text-xs font-normal text-gray-400">Buscando...</span>
              )}
            </span>
            <input
              value={values[field]}
              readOnly={readOnly || isDisabled}
              required={isRequired}
              maxLength={field === "state" ? 2 : undefined}
              onChange={(event) => onChange(field, event.target.value)}
              onBlur={
                field === "zipCode" && onZipCodeBlur
                  ? (event) => {
                    onZipCodeBlur(event.target.value);
                  }
                  : undefined
              }
              className={`h-11 w-full rounded-md border px-3 text-sm outline-none ${
                readOnly || isDisabled
                  ? "cursor-default border-gray-200 bg-gray-50 text-gray-700"
                  : "border-gray-300 bg-white focus:border-[#F5C518]"
              } ${fieldError ? "border-red-300 focus:border-red-500" : ""}`}
            />
            {fieldError && <span className="mt-1 block text-xs text-red-600">{fieldError}</span>}
          </label>
        );
      })}
    </div>
  );
}
