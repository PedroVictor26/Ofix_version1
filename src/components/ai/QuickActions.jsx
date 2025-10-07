import React from 'react';

export default function QuickActions({ userType = 'cliente', onActionClick, className = '' }) {
	const commonActions = [
		{ type: 'status_os', label: 'Ver status da OS' },
		{ type: 'agendar', label: 'Agendar serviço' },
		{ type: 'diagnostico', label: 'Iniciar diagnóstico' }
	];

	const mechanicActions = [
		{ type: 'procedimentos', label: 'Procedimentos técnicos' },
		{ type: 'historico_solucoes', label: 'Histórico de soluções' }
	];

	const actions = userType === 'mecanico' ? [...commonActions, ...mechanicActions] : commonActions;

	return (
		<div className={`flex flex-wrap gap-2 ${className}`}>
			{actions.map((a) => (
				<button
					key={a.type}
					onClick={() => onActionClick?.(a)}
					className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-full border border-gray-200 transition-colors"
				>
					{a.label}
				</button>
			))}
		</div>
	);
}
