import { JobForm } from "@/components/jobs/job-form";
import { createJobApplicationAction } from "../actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function NewJobPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Add job</h1>
        <p className="text-sm text-zinc-500">
          Fit score is calculated from stack match, Moldova eligibility, region, and salary.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Role details</CardTitle>
          <CardDescription>
            Track applications separately from the B2B leads funnel.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <JobForm
            action={createJobApplicationAction}
            submitLabel="Create job"
          />
        </CardContent>
      </Card>
    </div>
  );
}
