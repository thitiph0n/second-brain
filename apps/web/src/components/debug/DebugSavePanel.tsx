// Debug component to test save functionality
import { useState } from 'react';

export function DebugSavePanel({ drawingId, onSave, onForceSave }: { drawingId: string; onSave: () => void; onForceSave?: () => void }) {
	const [clickCount, setClickCount] = useState(0);
	const [forceClickCount, setForceClickCount] = useState(0);

	return (
		<div style={{
			position: 'fixed',
			top: '10px',
			right: '10px',
			background: 'rgba(0,0,0,0.9)',
			color: 'white',
			padding: '10px',
			borderRadius: '5px',
			fontSize: '12px',
			zIndex: 9999,
			minWidth: '200px'
		}}>
			<div style={{ marginBottom: '10px' }}>
				<strong>Debug Panel</strong>
				<div>ID: {drawingId.substring(0, 8)}...</div>
			</div>

			<button
				onClick={() => {
					setClickCount(prev => prev + 1);
					console.log(`DebugSavePanel: Manual save button clicked ${clickCount + 1} times`);
					onSave();
				}}
				style={{
					background: '#ff4444',
					color: 'white',
					border: 'none',
					padding: '5px 10px',
					borderRadius: '3px',
					cursor: 'pointer',
					marginTop: '5px',
					marginRight: '5px',
					width: '45%'
				}}
			>
				Manual Save ({clickCount})
			</button>

			{onForceSave && (
				<button
					onClick={() => {
						setForceClickCount(prev => prev + 1);
						console.log(`DebugSavePanel: Force save button clicked ${forceClickCount + 1} times`);
						onForceSave();
					}}
					style={{
						background: '#ff8800',
						color: 'white',
						border: 'none',
						padding: '5px 10px',
						borderRadius: '3px',
						cursor: 'pointer',
						marginTop: '5px',
						width: '45%'
					}}
				>
					Force Save ({forceClickCount})
				</button>
			)}
		</div>
	);
}