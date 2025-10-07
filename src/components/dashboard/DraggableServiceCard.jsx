import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import ServiceCard from './ServiceCard';

export default function DraggableServiceCard({ id, servico, cliente, veiculo, onClick }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: id,
        data: {
            type: 'card',
            servico: servico,
        }
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition: transition || 'transform 200ms cubic-bezier(0.25, 1, 0.5, 1)',
        zIndex: isDragging ? 100 : 'auto',
        opacity: isDragging ? 0.9 : 1,
        scale: isDragging ? 1.05 : 1,
        cursor: isDragging ? 'grabbing' : 'grab',
    };

    return (
        <div 
            ref={setNodeRef} 
            style={style} 
            {...attributes} 
            {...listeners} 
            onClick={(e) => {
                e.stopPropagation();
                onClick();
            }}
            className={`transition-all duration-200 ${
                isDragging 
                    ? 'shadow-2xl ring-2 ring-blue-400 ring-opacity-50' 
                    : 'hover:shadow-md'
            }`}
        >
            <ServiceCard
                servico={servico}
                cliente={cliente}
                veiculo={veiculo}
            />
        </div>
    );
}