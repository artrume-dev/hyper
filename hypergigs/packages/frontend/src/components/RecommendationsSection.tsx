import { Star, Quote, Briefcase, Users } from 'lucide-react';
import type { Recommendation } from '@/types/user';

interface RecommendationsSectionProps {
  recommendations: Recommendation[];
}

export default function RecommendationsSection({ recommendations }: RecommendationsSectionProps) {
  if (!recommendations || recommendations.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold flex items-center gap-2">
        <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
        Recommendations
      </h2>

      <div className="grid gap-4">
        {recommendations.map((recommendation) => (
          <div
            key={recommendation.id}
            className="bg-white border border-border rounded-xl p-6 space-y-4 hover:shadow-md transition-shadow"
          >
            {/* Quote Icon */}
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <Quote className="w-8 h-8 text-primary/20" />
              </div>

              {/* Recommendation Content */}
              <div className="flex-1 space-y-3">
                {/* Star Rating - for portfolio recommendations */}
                {recommendation.rating && recommendation.rating > 0 && (
                  <div className="flex items-center gap-1 mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${
                          star <= recommendation.rating!
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                    <span className="ml-2 text-sm font-medium text-gray-600">
                      {recommendation.rating}/5
                    </span>
                  </div>
                )}

                <p className="text-gray-700 leading-relaxed italic">
                  "{recommendation.message}"
                </p>

                {/* Context Badge - Show what project/team this recommendation is about */}
                {(recommendation.project || recommendation.team || recommendation.portfolio) && (
                  <div className="flex items-center gap-2 text-sm">
                    {recommendation.project && (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-200">
                        <Briefcase className="w-3.5 h-3.5" />
                        <span className="font-medium">Work on: {recommendation.project.title}</span>
                      </div>
                    )}
                    {recommendation.team && !recommendation.project && (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-50 text-purple-700 rounded-full border border-purple-200">
                        <Users className="w-3.5 h-3.5" />
                        <span className="font-medium">Team: {recommendation.team.name}</span>
                      </div>
                    )}
                    {recommendation.portfolio && !recommendation.project && !recommendation.team && (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 rounded-full border border-green-200">
                        <Briefcase className="w-3.5 h-3.5" />
                        <span className="font-medium">Portfolio: {recommendation.portfolio.name}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Recommender Info */}
                {recommendation.sender && (
                  <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
                    {recommendation.sender.avatar ? (
                      <img
                        src={recommendation.sender.avatar}
                        alt={`${recommendation.sender.firstName} ${recommendation.sender.lastName}`}
                        className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center border-2 border-gray-200">
                        <span className="text-sm font-semibold text-primary">
                          {recommendation.sender.firstName?.[0]}{recommendation.sender.lastName?.[0]}
                        </span>
                      </div>
                    )}

                    <div className="flex-1">
                      <p className="font-semibold text-sm">
                        {recommendation.sender.firstName} {recommendation.sender.lastName}
                      </p>
                      {recommendation.sender.jobTitle && (
                        <p className="text-xs text-muted-foreground">
                          {recommendation.sender.jobTitle}
                        </p>
                      )}
                    </div>

                    {/* Date */}
                    <div className="text-xs text-muted-foreground">
                      {new Date(recommendation.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        year: 'numeric',
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
