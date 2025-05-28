import { useSession, getSession } from 'next-auth/react';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { GetServerSideProps } from 'next';
import { prisma } from '../../lib/prisma';
import { CheckCircleIcon, PlusCircleIcon, ArchiveBoxIcon, ArrowRightIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/router';
import Navbar from '../../components/Navbar';

type Competition = {
  id: string;
  name: string;
  description: string;
  logo?: string;
  startDate: Date;
  endDate: Date;
  status: string;
  createdAt: Date;
  updatedAt: Date;
};

type CompetitionUser = {
  id: string;
  competitionId: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
};

type CompetitionsPageProps = {
  joinedCompetitions: Competition[];
  availableCompetitions: Competition[];
  archivedCompetitions: Competition[];
};

const SectionCard = ({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) => (
  <div className="bg-white rounded-xl shadow-md border border-gray-300 p-6 mb-8">
    <div className="flex items-center mb-6">
      <span className="mr-3">{icon}</span>
      <h2 className="text-xl font-bold text-gray-900">{title}</h2>
    </div>
    {children}
  </div>
);

const CompetitionCard = ({ competition, actionLabel, actionIcon, onAction, disabled = false }: {
  competition: Competition;
  actionLabel: string;
  actionIcon: React.ReactNode;
  onAction?: () => void;
  disabled?: boolean;
}) => (
  <div className="bg-gray-50 border border-gray-300 rounded-xl shadow-sm p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
    <div>
      <div className="flex items-center space-x-3 mb-2">
        {competition.logo ? (
          <img 
            src={competition.logo} 
            alt={`${competition.name} logo`}
            className="h-8 w-8 object-contain flex-shrink-0"
          />
        ) : (
          <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-blue-600 font-bold text-sm">
              {competition.name.charAt(0)}
            </span>
          </div>
        )}
        <h3 className="text-lg font-bold text-gray-900 flex-1">{competition.name}</h3>
      </div>
      <div className="text-xs text-gray-500 mb-3">
        <p><span className="font-medium">Start:</span> {new Date(competition.startDate).toLocaleDateString()}</p>
        <p><span className="font-medium">End:</span> {new Date(competition.endDate).toLocaleDateString()}</p>
      </div>
    </div>
    <button
      className={`mt-2 flex items-center justify-center px-3 py-1.5 rounded-lg font-medium text-sm transition
        ${disabled ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
      onClick={onAction}
      disabled={disabled}
    >
      {actionIcon}
      <span className="ml-2">{actionLabel}</span>
    </button>
  </div>
);

export default function CompetitionsPage({
  joinedCompetitions,
  availableCompetitions,
  archivedCompetitions,
}: CompetitionsPageProps) {
  const { t } = useTranslation('common');
  const { data: session } = useSession();
  const router = useRouter();

  const handleViewCompetition = (competitionId: string) => {
    router.push(`/competitions/${competitionId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <PencilSquareIcon className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">
              {t('competitions.title')}
            </h1>
          </div>
          <p className="text-gray-600">
            {t('competitions.subtitle')}
          </p>
        </div>

        {/* Joined Competitions */}
        <SectionCard icon={<CheckCircleIcon className="h-6 w-6 text-green-500" />} title={t('competitions.joined')}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {joinedCompetitions.length > 0 ? (
              joinedCompetitions.map((competition) => (
                <CompetitionCard
                  key={competition.id}
                  competition={competition}
                  actionLabel={t('competitions.view') || 'View'}
                  actionIcon={<ArrowRightIcon className="h-5 w-5" />}
                  onAction={() => handleViewCompetition(competition.id)}
                />
              ))
            ) : (
              <div className="col-span-full text-center text-gray-500 py-8">{t('competitions.noJoined')}</div>
            )}
          </div>
        </SectionCard>
        
        {/* Available Competitions */}
        <SectionCard icon={<PlusCircleIcon className="h-6 w-6 text-blue-500" />} title={t('competitions.available')}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableCompetitions.length > 0 ? (
              availableCompetitions.map((competition) => (
                <CompetitionCard
                  key={competition.id}
                  competition={competition}
                  actionLabel={t('competitions.join') || 'Join'}
                  actionIcon={<PlusCircleIcon className="h-5 w-5" />}
                  onAction={() => {}}
                />
              ))
            ) : (
              <div className="col-span-full text-center text-gray-500 py-8">{t('competitions.noAvailable')}</div>
            )}
          </div>
        </SectionCard>
        
        {/* Archived Competitions */}
        <SectionCard icon={<ArchiveBoxIcon className="h-6 w-6 text-gray-500" />} title={t('competitions.archived')}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {archivedCompetitions.length > 0 ? (
              archivedCompetitions.map((competition) => (
                <CompetitionCard
                  key={competition.id}
                  competition={competition}
                  actionLabel={t('competitions.viewResults') || 'View Results'}
                  actionIcon={<ArchiveBoxIcon className="h-5 w-5" />}
                  onAction={() => handleViewCompetition(competition.id)}
                />
              ))
            ) : (
              <div className="col-span-full text-center text-gray-500 py-8">{t('competitions.noArchived')}</div>
            )}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context);
  
  if (!session) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }

  // Fetch all competitions
  const allCompetitions = await prisma.competition.findMany({
    orderBy: {
      startDate: 'desc',
    },
  });

  // Fetch user's joined competitions
  const userCompetitions = await prisma.competitionUser.findMany({
    where: {
      userId: session.user.id,
    },
    select: {
      competitionId: true,
    },
  });

  const joinedCompetitionIds = userCompetitions.map((uc: CompetitionUser) => uc.competitionId);
  const now = new Date();

  // Filter competitions into three groups
  const joinedCompetitions = allCompetitions.filter((c: Competition) => 
    joinedCompetitionIds.includes(c.id) && c.endDate > now
  );

  const availableCompetitions = allCompetitions.filter((c: Competition) => 
    !joinedCompetitionIds.includes(c.id) && c.endDate > now
  );

  const archivedCompetitions = allCompetitions.filter((c: Competition) => 
    c.endDate <= now
  );

  return {
    props: {
      ...(await serverSideTranslations(context.locale || 'en', ['common'])),
      joinedCompetitions: JSON.parse(JSON.stringify(joinedCompetitions)),
      availableCompetitions: JSON.parse(JSON.stringify(availableCompetitions)),
      archivedCompetitions: JSON.parse(JSON.stringify(archivedCompetitions)),
    },
  };
}; 