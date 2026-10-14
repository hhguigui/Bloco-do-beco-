import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Props {
  id: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: Record<string, string>;
  placeholder?: string;
  testId: string;
  className?: string;
}

export default function FieldSelect({ id, label, value, onChange, options, placeholder = "Selecione", testId, className }: Props) {
  return (
    <div className={className ?? "space-y-2"}>
      {label && <Label htmlFor={id}>{label}</Label>}
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id} className="w-full bg-white" data-testid={testId}>
          <SelectValue>
            {(v) => (v ? options[v as string] : <span className="text-muted-foreground">{placeholder}</span>)}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {Object.entries(options).map(([key, text]) => (
            <SelectItem key={key} value={key} data-testid={`${testId}-option-${key}`}>
              {text}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
