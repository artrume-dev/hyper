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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { teamService } from '@/services/api/team.service';
import { Loader2 } from 'lucide-react';
import type { SubTeamCategory } from '@/types/team';

interface SubTeamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentTeamId: string;
  parentTeamName: string;
  onSuccess?: () => void;
}

const subTeamSchema = z.object({
  name: z.string().min(1, 'Team name is required').max(100),
  description: z.string().max(500).optional(),
  subTeamCategory: z.enum([
    'ENGINEERING',
    'MARKETING',
    'DESIGN',
    'HR',
    'SALES',
    'PRODUCT',
    'OPERATIONS',
    'FINANCE',
    'LEGAL',
    'SUPPORT',
    'OTHER',
  ]),
  avatar: z.string().url('Must be a valid URL').optional().or(z.literal('')),
});

type SubTeamFormData = z.infer<typeof subTeamSchema>;

const CATEGORY_OPTIONS: { value: SubTeamCategory; label: string }[] = [
  { value: 'ENGINEERING', label: 'Engineering' },
  { value: 'MARKETING', label: 'Marketing' },
  { value: 'DESIGN', label: 'Design' },
  { value: 'HR', label: 'Human Resources' },
  { value: 'SALES', label: 'Sales' },
  { value: 'PRODUCT', label: 'Product' },
  { value: 'OPERATIONS', label: 'Operations' },
  { value: 'FINANCE', label: 'Finance' },
  { value: 'LEGAL', label: 'Legal' },
  { value: 'SUPPORT', label: 'Customer Support' },
  { value: 'OTHER', label: 'Other' },
];

export default function SubTeamDialog({
  open,
  onOpenChange,
  parentTeamId,
  parentTeamName,
  onSuccess,
}: SubTeamDialogProps) {
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<SubTeamFormData>({
    resolver: zodResolver(subTeamSchema),
    defaultValues: {
      name: '',
      description: '',
      subTeamCategory: 'ENGINEERING',
      avatar: '',
    },
  });

  const selectedCategory = watch('subTeamCategory');

  const onSubmit = async (data: SubTeamFormData) => {
    setIsCreating(true);
    try {
      await teamService.createSubTeam(parentTeamId, {
        name: data.name,
        description: data.description,
        type: 'DEPARTMENT',
        subTeamCategory: data.subTeamCategory,
        avatar: data.avatar || undefined,
      });

      toast({
        title: 'Sub-team created!',
        description: `${data.name} has been created successfully.`,
      });

      if (onSuccess) {
        onSuccess();
      }

      onOpenChange(false);
      reset();
    } catch (error: any) {
      toast({
        title: 'Failed to create sub-team',
        description: error.response?.data?.error || 'An error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    if (!isCreating) {
      onOpenChange(false);
      reset();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create Sub-Team under {parentTeamName}</DialogTitle>
          <DialogDescription>
            Create a new department or sub-team. This will be a child team under {parentTeamName}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Team Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Team Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="e.g., Engineering Team"
              disabled={isCreating}
            />
            {errors.name && (
              <p className="text-sm text-destructive" role="alert">
                {errors.name.message}
              </p>
            )}
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">
              Department Category <span className="text-destructive">*</span>
            </Label>
            <Select
              value={selectedCategory}
              onValueChange={(value: SubTeamCategory) =>
                setValue('subTeamCategory', value, { shouldValidate: true })
              }
              disabled={isCreating}
            >
              <SelectTrigger id="category" className="w-full">
                <SelectValue placeholder="Choose a category..." />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.subTeamCategory && (
              <p className="text-sm text-destructive" role="alert">
                {errors.subTeamCategory.message}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">
              Description <span className="text-muted-foreground">(Optional)</span>
            </Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Describe the purpose and focus of this team..."
              className="min-h-[100px] resize-none"
              disabled={isCreating}
              maxLength={500}
            />
            {errors.description && (
              <p className="text-sm text-destructive" role="alert">
                {errors.description.message}
              </p>
            )}
          </div>

          {/* Avatar URL */}
          <div className="space-y-2">
            <Label htmlFor="avatar">
              Avatar URL <span className="text-muted-foreground">(Optional)</span>
            </Label>
            <Input
              id="avatar"
              {...register('avatar')}
              type="url"
              placeholder="https://example.com/avatar.jpg"
              disabled={isCreating}
            />
            {errors.avatar && (
              <p className="text-sm text-destructive" role="alert">
                {errors.avatar.message}
              </p>
            )}
          </div>

          {/* Actions */}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Sub-Team'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
