import { CompanyForm } from "@/components/companies/company-form";
import { createCompanyAction } from "../actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function NewCompanyPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Add company</h1>
        <p className="text-sm text-zinc-500">
          Score is calculated automatically from funding, hiring, size, and stack.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Company details</CardTitle>
          <CardDescription>
            Fill what you know — you can enrich contacts and outreach next.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CompanyForm
            action={createCompanyAction}
            submitLabel="Create company"
          />
        </CardContent>
      </Card>
    </div>
  );
}
