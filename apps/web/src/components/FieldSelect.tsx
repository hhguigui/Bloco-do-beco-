import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface Props {
  id: string;
  value: string;
  onChange: (value: string) => void;
  options: Record<string, string>;
  placeholder?: string;
  testId: string;
  className?: string;
}

export default function FieldSelect({ id, value, onChange, options, placeholder = "Selecione", testId, className }: Props) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger id={id} className={cn("w-full bg-white h-11", className)} data-testid={testId}>
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
  );
}
