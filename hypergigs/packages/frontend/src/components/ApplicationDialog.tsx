import { useState } from 'react';
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
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { applicationService } from '@/services/api/application.service';
import { Loader2 } from 'lucide-react';
import type { JobPosting } from '@/types/job';

interface ApplicationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job: JobPosting;
  onSuccess?: () => void;
}

const applicationSchema = z.object({
  coverLetter: z
    .string()
    .min(50, 'Cover letter must be at least 50 characters')
    .max(2000, 'Cover letter must be less than 2000 characters')
    .optional()
    .or(z.literal('')),
  resumeUrl: z
    .string()
    .url('Please enter a valid URL')
    .optional()
    .or(z.literal('')),
  portfolioUrl: z
    .string()
    .url('Please enter a valid URL')
    .optional()
    .or(z.literal('')),
});

type ApplicationFormData = z.infer<typeof applicationSchema>;

export default function ApplicationDialog({
  open,
  onOpenChange,
  job,
  onSuccess,
}: ApplicationDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ApplicationFormData>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      coverLetter: '',
      resumeUrl: '',
      portfolioUrl: '',
    },
  });

  const onSubmit = async (data: ApplicationFormData) => {
    setIsSubmitting(true);
    try {
      await applicationService.applyToJob(job.id, {
        coverLetter: data.coverLetter || undefined,
        resumeUrl: data.resumeUrl || undefined,
        portfolioUrl: data.portfolioUrl || undefined,
      });

      toast({
        title: 'Application submitted!',
        description: `Your application for ${job.title} has been sent successfully.`,
      });

      if (onSuccess) {
        onSuccess();
      }

      onOpenChange(false);
      reset();
    } catch (error: any) {
      toast({
        title: 'Failed to submit application',
        description:
          error.response?.data?.error || 'An error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onOpenChange(false);
      reset();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Apply for {job.title}</DialogTitle>
          <DialogDescription>
            Submit your application to {job.team?.name}. Fill in the details below to
            increase your chances of getting noticed.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Cover Letter */}
          <div className="space-y-2">
            <Label htmlFor="coverLetter">
              Cover Letter <span className="text-muted-foreground">(Optional)</span>
            </Label>
            <Textarea
              id="coverLetter"
              {...register('coverLetter')}
              placeholder="Tell us why you're a great fit for this role..."
              className="min-h-[200px] resize-y"
              disabled={isSubmitting}
              maxLength={2000}
            />
            <p className="text-xs text-muted-foreground">
              {errors.coverLetter
                ? errors.coverLetter.message
                : 'Minimum 50 characters, maximum 2000 characters'}
            </p>
          </div>

          {/* Resume URL */}
          <div className="space-y-2">
            <Label htmlFor="resumeUrl">
              Resume URL <span className="text-muted-foreground">(Optional)</span>
            </Label>
            <Input
              id="resumeUrl"
              type="url"
              {...register('resumeUrl')}
              placeholder="https://example.com/your-resume.pdf"
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground">
              {errors.resumeUrl
                ? errors.resumeUrl.message
                : 'Link to your resume on Google Drive, Dropbox, or your website'}
            </p>
          </div>

          {/* Portfolio URL */}
          <div className="space-y-2">
            <Label htmlFor="portfolioUrl">
              Portfolio URL <span className="text-muted-foreground">(Optional)</span>
            </Label>
            <Input
              id="portfolioUrl"
              type="url"
              {...register('portfolioUrl')}
              placeholder="https://yourportfolio.com"
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground">
              {errors.portfolioUrl
                ? errors.portfolioUrl.message
                : 'Link to your portfolio, GitHub, or personal website'}
            </p>
          </div>

          {/* Info Message */}
          <div className="p-4 bg-muted rounded-lg text-sm">
            <p className="text-muted-foreground">
              Your profile information (name, email, bio, skills, and experience) will be
              automatically included with your application.
            </p>
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
                  Submitting...
                </>
              ) : (
                'Submit Application'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
