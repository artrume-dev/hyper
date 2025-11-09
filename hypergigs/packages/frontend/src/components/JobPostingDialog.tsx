import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import RichTextEditor from '@/components/RichTextEditor';
import { useToast } from '@/hooks/use-toast';
import { jobService } from '@/services/api/job.service';
import { teamService } from '@/services/api/team.service';
import { Loader2, Star, Zap } from 'lucide-react';
import type { JobPosting, JobType, JobStatus } from '@/types/job';

interface JobPostingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamId: string;
  teamName: string;
  preSelectedSubTeamId?: string; // Pre-select a sub-team in the dropdown
  job?: JobPosting; // If provided, edit mode; otherwise create mode
  onSuccess?: () => void;
}

const jobPostingSchema = z.object({
  title: z.string().min(1, 'Job title is required').max(200),
  description: z.string().min(10, 'Description must be at least 10 characters').max(5000),
  location: z.string().max(200).optional().or(z.literal('')),
  type: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'FREELANCE']),
  status: z.enum(['ACTIVE', 'CLOSED', 'DRAFT']),
  isFeatured: z.boolean().optional(),
  isSponsored: z.boolean().optional(),
  minSalary: z.string().optional().or(z.literal('')),
  maxSalary: z.string().optional().or(z.literal('')),
  currency: z.string().length(3, 'Currency must be 3 letters (e.g., USD)').optional().or(z.literal('')),
  subTeamId: z.string().optional().or(z.literal('')),
}).refine(
  (data) => {
    const min = data.minSalary ? parseFloat(data.minSalary) : null;
    const max = data.maxSalary ? parseFloat(data.maxSalary) : null;
    if (min !== null && max !== null) {
      return min <= max;
    }
    return true;
  },
  {
    message: 'Minimum salary must be less than or equal to maximum salary',
    path: ['maxSalary'],
  }
);

type JobPostingFormData = z.infer<typeof jobPostingSchema>;

const JOB_TYPE_OPTIONS: { value: JobType; label: string }[] = [
  { value: 'FULL_TIME', label: 'Full-time' },
  { value: 'PART_TIME', label: 'Part-time' },
  { value: 'CONTRACT', label: 'Contract' },
  { value: 'FREELANCE', label: 'Freelance' },
];

const JOB_STATUS_OPTIONS: { value: JobStatus; label: string }[] = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'CLOSED', label: 'Closed' },
];

export default function JobPostingDialog({
  open,
  onOpenChange,
  teamId,
  teamName,
  preSelectedSubTeamId,
  job,
  onSuccess,
}: JobPostingDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingSubTeams, setLoadingSubTeams] = useState(false);
  const [subTeams, setSubTeams] = useState<any[]>([]);
  const [description, setDescription] = useState('');
  const { toast } = useToast();
  const isEditMode = !!job;

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<JobPostingFormData>({
    resolver: zodResolver(jobPostingSchema),
    defaultValues: {
      title: '',
      description: '',
      location: '',
      type: 'FULL_TIME',
      status: 'ACTIVE',
      isFeatured: false,
      isSponsored: false,
      minSalary: '',
      maxSalary: '',
      currency: 'USD',
      subTeamId: '',
    },
  });

  const selectedType = watch('type');
  const selectedStatus = watch('status');
  const selectedSubTeamId = watch('subTeamId');
  const isFeatured = watch('isFeatured');
  const isSponsored = watch('isSponsored');

  // Load sub-teams when dialog opens
  useEffect(() => {
    if (open && teamId) {
      loadSubTeams();
    }
  }, [open, teamId]);

  const loadSubTeams = async () => {
    setLoadingSubTeams(true);
    try {
      const subTeams = await teamService.getSubTeams(teamId);
      setSubTeams(subTeams || []);
    } catch (error) {
      console.error('Failed to load sub-teams:', error);
      setSubTeams([]);
    } finally {
      setLoadingSubTeams(false);
    }
  };

  // Load job data in edit mode or set pre-selected sub-team
  useEffect(() => {
    if (job) {
      reset({
        title: job.title,
        description: job.description,
        location: job.location || '',
        type: job.type,
        status: job.status,
        isFeatured: job.isFeatured || false,
        isSponsored: job.isSponsored || false,
        minSalary: job.minSalary ? String(job.minSalary) : '',
        maxSalary: job.maxSalary ? String(job.maxSalary) : '',
        currency: job.currency || 'USD',
        subTeamId: job.subTeamId || '',
      });
      setDescription(job.description);
    } else {
      reset({
        title: '',
        description: '',
        location: '',
        type: 'FULL_TIME',
        status: 'ACTIVE',
        isFeatured: false,
        isSponsored: false,
        minSalary: '',
        maxSalary: '',
        currency: 'USD',
        subTeamId: preSelectedSubTeamId || '',
      });
      setDescription('');
    }
  }, [job, preSelectedSubTeamId, reset]);

  const handleDescriptionChange = (html: string) => {
    setDescription(html);
    setValue('description', html, { shouldValidate: true });
  };

  const onSubmit = async (data: JobPostingFormData) => {
    setIsSubmitting(true);
    try {
      const minSalary = data.minSalary ? parseInt(data.minSalary, 10) : undefined;
      const maxSalary = data.maxSalary ? parseInt(data.maxSalary, 10) : undefined;

      if (isEditMode && job) {
        await jobService.updateJob(job.id, {
          title: data.title,
          description: description, // Use rich text description
          location: data.location || undefined,
          type: data.type,
          status: data.status,
          isFeatured: data.isFeatured,
          isSponsored: data.isSponsored,
          minSalary,
          maxSalary,
          currency: data.currency || undefined,
          subTeamId: data.subTeamId || undefined,
        });

        toast({
          title: 'Job updated!',
          description: `${data.title} has been updated successfully.`,
        });
      } else {
        await jobService.createJob(teamId, {
          title: data.title,
          description: description, // Use rich text description
          location: data.location || undefined,
          type: data.type,
          status: data.status,
          isFeatured: data.isFeatured,
          isSponsored: data.isSponsored,
          minSalary,
          maxSalary,
          currency: data.currency || undefined,
          subTeamId: data.subTeamId || undefined,
        });

        toast({
          title: 'Job posted!',
          description: `${data.title} has been created successfully.`,
        });
      }

      if (onSuccess) {
        onSuccess();
      }

      onOpenChange(false);
      if (!isEditMode) {
        reset();
      }
    } catch (error: any) {
      toast({
        title: isEditMode ? 'Failed to update job' : 'Failed to create job',
        description: error.response?.data?.error || 'An error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onOpenChange(false);
      if (!isEditMode) {
        reset();
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Edit Job Posting' : `Post a Job at ${teamName}`}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Update the job posting details below.'
              : 'Create a new job posting. Fill in the details below to attract the right candidates.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Job Title */}
          <div className="space-y-2">
            <Label htmlFor="title">
              Job Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              {...register('title')}
              placeholder="e.g., Senior Frontend Developer"
              disabled={isSubmitting}
            />
            {errors.title && (
              <p className="text-sm text-destructive" role="alert">
                {errors.title.message}
              </p>
            )}
          </div>

          {/* Job Type & Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">
                Job Type <span className="text-destructive">*</span>
              </Label>
              <Select
                value={selectedType}
                onValueChange={(value: JobType) =>
                  setValue('type', value, { shouldValidate: true })
                }
                disabled={isSubmitting}
              >
                <SelectTrigger id="type">
                  <SelectValue placeholder="Choose job type..." />
                </SelectTrigger>
                <SelectContent>
                  {JOB_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.type && (
                <p className="text-sm text-destructive" role="alert">
                  {errors.type.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">
                Status <span className="text-destructive">*</span>
              </Label>
              <Select
                value={selectedStatus}
                onValueChange={(value: JobStatus) =>
                  setValue('status', value, { shouldValidate: true })
                }
                disabled={isSubmitting}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Choose status..." />
                </SelectTrigger>
                <SelectContent>
                  {JOB_STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.status && (
                <p className="text-sm text-destructive" role="alert">
                  {errors.status.message}
                </p>
              )}
            </div>
          </div>

          {/* Featured & Sponsored Toggles */}
          <div className="space-y-4 p-4 bg-muted/50 rounded-lg border">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <Label htmlFor="isFeatured" className="font-medium">
                    Featured Job
                  </Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  Highlight this job at the top with a gold badge
                </p>
              </div>
              <Switch
                id="isFeatured"
                checked={isFeatured}
                onCheckedChange={(checked) => setValue('isFeatured', checked, { shouldValidate: true })}
                disabled={isSubmitting}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-blue-500" />
                  <Label htmlFor="isSponsored" className="font-medium">
                    Sponsored Job
                  </Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  Promote this job throughout the job list with a blue badge
                </p>
              </div>
              <Switch
                id="isSponsored"
                checked={isSponsored}
                onCheckedChange={(checked) => setValue('isSponsored', checked, { shouldValidate: true })}
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Department/Sub-Team */}
          {subTeams.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="subTeam">
                Department{' '}
                {preSelectedSubTeamId ? (
                  <span className="text-muted-foreground">(Pre-selected)</span>
                ) : (
                  <span className="text-muted-foreground">(Optional)</span>
                )}
              </Label>
              <Select
                value={selectedSubTeamId || 'none'}
                onValueChange={(value) => setValue('subTeamId', value === 'none' ? '' : value, { shouldValidate: true })}
                disabled={isSubmitting || loadingSubTeams || !!preSelectedSubTeamId}
              >
                <SelectTrigger id="subTeam">
                  <SelectValue placeholder="Select department (optional)..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No specific department</SelectItem>
                  {subTeams.map((subTeam) => (
                    <SelectItem key={subTeam.id} value={subTeam.id}>
                      {subTeam.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {preSelectedSubTeamId
                  ? 'This job will be posted to the selected department'
                  : `Assign this job to a specific department/team within ${teamName}`}
              </p>
            </div>
          )}

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">
              Location <span className="text-muted-foreground">(Optional)</span>
            </Label>
            <Input
              id="location"
              {...register('location')}
              placeholder="e.g., Remote, New York, USA, or Hybrid"
              disabled={isSubmitting}
            />
            {errors.location && (
              <p className="text-sm text-destructive" role="alert">
                {errors.location.message}
              </p>
            )}
          </div>

          {/* Salary Range */}
          <div className="space-y-4">
            <Label>Salary Range (Optional)</Label>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minSalary" className="text-sm text-muted-foreground">
                  Minimum
                </Label>
                <Input
                  id="minSalary"
                  type="number"
                  {...register('minSalary')}
                  placeholder="e.g., 80000"
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxSalary" className="text-sm text-muted-foreground">
                  Maximum
                </Label>
                <Input
                  id="maxSalary"
                  type="number"
                  {...register('maxSalary')}
                  placeholder="e.g., 120000"
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency" className="text-sm text-muted-foreground">
                  Currency
                </Label>
                <Input
                  id="currency"
                  {...register('currency')}
                  placeholder="USD"
                  maxLength={3}
                  disabled={isSubmitting}
                />
              </div>
            </div>
            {errors.minSalary && (
              <p className="text-sm text-destructive" role="alert">
                {errors.minSalary.message}
              </p>
            )}
            {errors.maxSalary && (
              <p className="text-sm text-destructive" role="alert">
                {errors.maxSalary.message}
              </p>
            )}
            {errors.currency && (
              <p className="text-sm text-destructive" role="alert">
                {errors.currency.message}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">
              Job Description <span className="text-destructive">*</span>
            </Label>
            <RichTextEditor
              content={description}
              onChange={handleDescriptionChange}
              placeholder="Describe the role, responsibilities, requirements, and what makes this opportunity exciting..."
              className="min-h-[200px]"
            />
            <p className="text-xs text-muted-foreground">
              Minimum 10 characters, maximum 5000 characters
            </p>
            {errors.description && (
              <p className="text-sm text-destructive" role="alert">
                {errors.description.message}
              </p>
            )}
          </div>

          {/* Actions */}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isEditMode ? 'Updating...' : 'Creating...'}
                </>
              ) : isEditMode ? (
                'Update Job'
              ) : (
                'Post Job'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
