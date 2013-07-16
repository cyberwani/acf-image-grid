( function( $ ) {
	var root = this;
	var bb = root.Backbone;
	var acfImageGrid = root.acfImageGrid = root.acfImageGrid || {};

	// The width and height of each cell
	var cellDim = 120;


	/**
	 * Model for which cells are locked.
	 * It retrieves and saves the results to an input element.
	 */
	var InputModel = bb.Model.extend( {

		/**
		 * @param HTMLInputElement input - the input where the value is saved to
		 */
		init: function( input ) {
			this.input = $( input );

			var data = {};
			try {
				data = JSON.parse( this.input.val() );
				if ( !$.isPlainObject( data ) ) {
					data = {};
				}
			} catch( e ) { }

			this.set( data );
		},

		/**
		 * Save the value back to the input field
		 */
		save: function() {
			this.input.val( JSON.stringify( this.toJSON() ) );
		},


		/**
		 * Check if a cell is locked
		 *
		 * @param int x
		 * @param int y
		 */
		getCell: function( x, y ) {
			return this.get( x+','+y );
		},

		/**
		 * Set the status of a locked
		 */
		setCell: function( x, y, w, h, status, image ) {
			// Set the 'filled-overflow' cells to empty when setting a 'filled' to 'empty'
			if ( status == 'empty' ) {
				var old = this.get( x+','+y );
				if ( old && old.status == 'filled' && (old.w > 1 || old.h > 1) ) {
					for ( var xi=x; xi<x+old.w; ++xi ) {
						for ( var yi=y; yi<y+old.h; ++yi ) {
							if ( xi!=x || yi!=y ) {
								this.setCell( xi, yi, 1, 1, 'empty' );
							}
						}
					}
				}
			}

			// Setting the cell
			this.set( x+','+y, {
				x: x,
				y: y,
				w: w,
				h: h,
				status: status,
				image: image
			});

			// Set the 'filled-overflow' for the other cells if need be
			if ( status == 'filled' ) {
				for ( var xi=x; xi<x+w; ++xi ) {
					for ( var yi=y; yi<y+h; ++yi ) {
						if ( xi!=x || yi!=y ) {
							this.set( xi+','+yi, {
								x: xi,
								y: yi,
								w: 1,
								h: 1,
								status: 'filled-overflow',
								image: image,
								origin: { x: x, y: y}
							});
						}
					}
				}
			}
		}
	} );

	// Setup the View for using the WordPress media manager
  $( document ).ready( function() {
		acfImageGrid.mediaFrame = wp.media({
			//title : dfippt_L10n.manager_title,
			multiple : false,
			library : { type : 'image' },
			//button : { text : dfippt_L10n.manager_button }
		});
	});

	

		

	/**
	 * View for handling the UI for selecting the images in the grid
	 */
	var InputUiView = bb.View.extend( {

		events: {
			'click button.add-image': 'onAddImage',
			'click .action-menu .toggle': 'toggleMenu',
			'click [data-action="empty"]': 'onRemoveImage',
			'click [data-action="change-image"]': 'onAddImage',
			'draginit': 'onDragInit',
			'drag': 'onDrag',
			'dragend': 'onDragEnd'
		},

		/**
		 * Initialize the values
		 */
		initialize: function() {
			_.bindAll( this, 'assignSelectedImageInMediaPopup', 'onMediaPopupClose', 'onCellChange' );

			this.numOfRows = this.$el.data('numberOfRows');
			this.numOfColumns = this.$el.data('numberOfColumns');

			this.model = new InputModel();
			this.model.init( this.$el.find( 'input.acf-image-grid-value' ) );
			this.model.on( 'change', this.onCellChange );
		},


		/**
		 * Render the table of checkboxes
		 */
		attach: function() {
			// All the html is generated by PHP and the events are handled by delegation
		},

		/**
		 * A callback for when the WP media library popup is opening to set the image selected
		 */
		assignSelectedImageInMediaPopup: function() {
			var attachment;
			var selection = acfImageGrid.mediaFrame.state().get('selection');
			var image = this.model.getCell( this._popupFor.x, this._popupFor.y );
			var id = image && image.image ? image.image.id : null; // The WP image ID

			attachment = wp.media.attachment(id);
			attachment.fetch();

			selection.add(attachment ? [ attachment ] : []);
		},

		/**
		 * The event callback for removing an image from a cell
		 *
		 * @param Event event - the event object, this needs to be triggered by either the cell or a child of the cell
		 */
		onRemoveImage: function( event ) {
			var cell = $(event.target).closest( '.acf-image-grid-cell' );
			this.model.setCell( cell.data('x'), cell.data('y'), 1, 1, 'empty' );
			this.model.save();
			return false;
		},


		/**
		 * The event callback for adding or updating the image in a cell
		 *
		 * @param Event event - the event object, this needs to be triggered by either the cell or a child of the cell
		 */
		onAddImage: function( event ) {
			var cell = $(event.target).closest( '.acf-image-grid-cell' );

			// prepare to open the media manager
			this._popupFor = { x: cell.data('x'), y: cell.data('y'), cell: cell };
			acfImageGrid.mediaFrame.on('open', this.assignSelectedImageInMediaPopup );

			// everthing is set open the media manager
			acfImageGrid.mediaFrame.open();

			// remove our handling for the media manager in case someone else uses it
			acfImageGrid.mediaFrame.off('open', this.assignSelectedImageInMediaPopup );

			// set the close action to grab the image
			acfImageGrid.mediaFrame.on('close', this.onMediaPopupClose );

			return false;
		},


		/**
		 * The callback for the media manager closing.
		 *
		 * If an image is selected, the image will be set for the cell (either switching the cell to 'filled' or replacing the image).
		 */
		onMediaPopupClose: function() {
			// remove our close action for the media manager in case someone else uses it
			acfImageGrid.mediaFrame.off('close', this.onMediaPopupClose );

			// Get the images
			var images = acfImageGrid.mediaFrame.state().get('selection');

			// set the images
			images.each(_.bind(function (image) {	
				// Set value and copy the width and height
				var oldCell = this.model.getCell( this._popupFor.x, this._popupFor.y );
				this.model.setCell( this._popupFor.x, this._popupFor.y, oldCell.w, oldCell.h, 'filled', image.attributes );
			}, this));
			this.model.save();
		},

		/**
		 * The callback for when a cell changes.
		 *
		 * This responses to changes to the model to update the UI.
		 */
		onCellChange: function( model, changes ) {
			var image, cellEl;

			// changes.changes is a hash of cells that have changed
			for( var key in changes.changes ) {
				// The cell image data
				image = this.model.get( key );

				// The element for the cell
				cellEl = this.$el.find( '.acf-image-grid-cell[data-x="'+image.x+'"][data-y="'+image.y+'"]' );

				// Remove status-* classes
				cellEl.removeClass( function( index, classes) {
					return (classes.match (/\bstatus-\S+/g) || []).join(' ');
				});

				// Add a class of 'status-[status]' to the cell so our CSS can do most of the work
				cellEl.addClass( 'status-'+image.status );

				// The parts that have to be dynamically set
				switch( image.status ) {
					case 'filled':
						// Set the cell span the number of columns and rows as defined,
						// and set the image as the background image
						cellEl.find( '.image' )
							.css( { 'backgroundImage': 'url("' + image.image.sizes.full.url + '")' } )
							.height( cellDim * image.h - 1)
							.width( cellDim * image.w - 1);
						cellEl.find( '.action-menu').removeClass( 'open' );
						break;

					case 'filled-overflow':
					case 'empty':
						// Remove the image that is set as the background image,
						// and undo the spanning of multiple rows and columns
						cellEl.find( '.image' ).css( { 'backgroundImage': '' } );
						cellEl.css( { height: '', width: '' });
						break;

					case 'locked':
						// nothing to do
						break;
				}
			}
		},

		/**
		 *	The event callback for opening and closing the action menu (change image and remove image) with each image
		 */
		toggleMenu: function( event ) {
			var menu = $( event.target ).parent();
			menu.toggleClass( 'open' );
		},

		/**
		 * The event callback for when the user first start the series of actions to start dragging.
		 *
		 * This is attached to this.$el because the elements being dragged will change 
		 * when a change is made. If if was bound to the actual element that was being
		 * dragged, then the dragging action would be lost when the image is resized
		 * or moved to another cell.
		 *
		 * There are two types of dragging actions:
		 *  1. Handle - when the handles are dragged to resize an image
		 *  2. Move - when the .outline element is dragged to move an image to another cell
		 *
		 * @param Event event
		 */
		onDragInit: function( event ) {

			var element = $( event.srcElement  );
			this._dragType = null;

			// Find any cell left in a drag state
			this.clearHandleDragStyles( this.$el.find( '.acf-image-grid-cell.resizing') );
			this.clearMoveDragStyles( this.$el.find( '.acf-image-grid-cell.moving') );

			if ( element.hasClass( 'handle') ) {
				// The user is dragging the resize handle
				this._dragType = 'handle';

				var outline = element.closest( '.outline' );
				var cell = element.closest( '.acf-image-grid-cell' ).addClass( 'resizing' );

				// Store the starting data for the drag and dragend events
				this._dragHandle = { x: cell.data('x'), y: cell.data('y'), cell: cell, handle: element, outline: outline};

			} else if ( element.hasClass( 'outline' ) ) {
				// The user is moving the image
				this._dragType = 'move';

				var cell = element.closest( '.acf-image-grid-cell' ).addClass( 'moving' );
				element.width( element.width() );
				element.height( element.height() );
				element.css({ top: 0, left: 0, right: 'auto', bottom: 'auto'});

				// Store the starting data for the drag and dragend events
				this._dragMove = { x: cell.data('x'), y: cell.data('y'), cell: cell, outline: element, startX: event.pageX, startY: event.pageY };
			}
		},


		/**
		 * The event callback for the drag event
		 */
		onDrag: function( event ) {
			switch( this._dragType ) {
				case 'handle':
					return this.onHandleDrag( event );

				case 'move':
					return this.onMoveDrag( event );
			}

		},


		/**
		 * Handles the drag event for the handles (resize)
		 */
		onHandleDrag: function( event ) {

			var cellOffset = this._dragHandle.cell.position();
			var offset = this.$el.offset();

			// Calculate the top-left (cx0, cy0) and bottom-right (cx1, cy1) corners of the proposed cell
			var cx0, cy0, cx1, cy1;
			var image = this.model.getCell( this._dragHandle.x, this._dragHandle.y );

			cx0 = this._dragHandle.x;
			cy0 = this._dragHandle.y;
			cx1 = this._dragHandle.x + image.w;
			cy1 = this._dragHandle.y + image.h;

			// x, y pixel coords within the grid where the cursor is
			var x = event.pageX - offset.left;
			var y = event.pageY - offset.top;

			// Update the bounding box dimension to reflect the user's action
			// and update the proposed cell
			if ( this._dragHandle.handle.data('y') == -1 ) {
				// for north handles
				
				// the Y starting edge in pixel
				var yBound = this._dragHandle.y * cellDim;
				// get the Y pixel value of where the user is dragging to, while inside the grid and not smalling than 1 grid unit
				var yDrag = Math.max( Math.min( (image.h - 1) * cellDim, y - yBound ), 0 - yBound );
				// update the outline size to match the dragging
				this._dragHandle.outline.css( { top: yDrag + 'px' } );

				// update the the proposed cell size
				cy0 = Math.min( Math.round( y / cellDim ), cy1 - 1);

			} else if ( this._dragHandle.handle.data('y') == 1 ) {
				// for south handles

				// the Y starting edge in pixel
				var yBound = (this._dragHandle.y + image.h) * cellDim;
				// get the Y pixel value of where the user is dragging to, while inside the grid and not smalling than 1 grid unit
				var yDrag = Math.max( Math.min( (image.h - 1) * cellDim, yBound - y ), yBound - this.$el.height() );
				// update the outline size to match the dragging
				this._dragHandle.outline.css( { bottom: yDrag + 'px' } );

				// update the outline size to match the dragging
				cy1 = Math.max( Math.round( y / cellDim ), cy0 + 1 );
			}

			if ( this._dragHandle.handle.data('x') == -1 ) {
				// for west handles

				// the X starting edge in pixel
				var xBound = this._dragHandle.x * cellDim;
				// get the X pixel value of where the user is dragging to, while inside the grid and not smalling than 1 grid unit
				var xDrag = Math.max( Math.min( (image.w - 1)*cellDim, x - xBound ), 0 - xBound );
				// update the outline size to match the dragging
				this._dragHandle.outline.css( { left: xDrag + 'px' } );

				// update the outline size to match the dragging
				cx0 = Math.min( Math.round( x / cellDim ), cx1 - 1);

			} else if ( this._dragHandle.handle.data('x') == 1 ) {
				// for east handles

				// the X starting edge in pixel
				var xBound = (this._dragHandle.x + image.w) * cellDim;
				// get the X pixel value of where the user is dragging to, while inside the grid and not smalling than 1 grid unit
				var xDrag = Math.max( Math.min( (image.w - 1)*cellDim, xBound - x ), xBound - this.$el.width() );
				// update the outline size to match the dragging
				this._dragHandle.outline.css( { right: xDrag + 'px' } );

				// update the outline size to match the dragging
				cx1 = Math.max( Math.round( x / cellDim ), cx0 + 1 );
			}

			// Did we trigger a size change?
			if ( cx0 != this._dragHandle.x || cy0 != this._dragHandle.y || cx1 != this._dragHandle.x + image.w || cy1 != this._dragHandle.y + image.h ) {
				// Validate if the new image can fit into the space
				var validResize = true;
				for ( var xi=cx0; validResize && xi<cx1; ++xi ) {
					for ( var yi=cy0; validResize && yi<cy1; ++yi ) {
						// Only check those that aren't occupied by the current image being resized
						if ( xi < this._dragHandle.x || xi >= this._dragHandle.x + image.w || yi < this._dragHandle.y || yi >= this._dragHandle.y + image.h ){
							validResize = this.model.getCell( xi, yi ).status == 'empty';
						}
					}
				}
				
				if ( validResize ) {
					// Resize the image
					var image = this.model.getCell( this._dragHandle.x, this._dragHandle.y ).image;
					// Empty out the previous image cell
					this.model.setCell( this._dragHandle.x, this._dragHandle.y, 1, 1, 'empty' );
					// Add the new image
					this.model.setCell( cx0, cy0, cx1-cx0, cy1-cy0, 'filled', image );

					// Clear the customized style information for the 
					this.clearHandleDragStyles( this._dragHandle.cell );

					var newCell = this.$el.find( '.acf-image-grid-cell[data-x="'+cx0+'"][data-y="'+cy0+'"]' );
					var outline = newCell.find( '.outline' );
					var handle = outline.find( '.handle[data-x="'+this._dragHandle.handle.data('x')+'"][data-y="'+this._dragHandle.handle.data('y')+'"]');
					this._dragHandle = { x: cx0, y: cy0, cell: newCell, handle: handle, outline: outline};
					this._dragHandle.cell.addClass( 'resizing' );
				}

			}
		},

		/**
		 * Handles the drag event for moving
		 */
		onMoveDrag: function( event ) {
			// Move the outline
			this._dragMove.outline.css( {
				'top': event.pageY - this._dragMove.startY,
				'left': event.pageX - this._dragMove.startX
			} );

			// What cell is the cursor over?
			var offset = this.$el.offset();
			var cellOffset = this._dragMove.cell.offset();
			// the x on the grid the image would start at if dragged
			var x = Math.floor( ( event.pageX - offset.left) / cellDim ) - Math.floor( ( this._dragMove.startX - cellOffset.left) / cellDim );
			// the y on the grid the image would start at if dragged
			var y = Math.floor( ( event.pageY - offset.top) / cellDim ) - Math.floor( ( this._dragMove.startY - cellOffset.top) / cellDim );

			// Did we move to a new set of cells
			if ( x != this._dragMove.x || y != this._dragMove.y ) {

				var image = this.model.getCell( this._dragMove.x, this._dragMove.y );
				var validMove = true;

				// determine if the cells are open for us to drop into
				// 1) It fit within the grid
				// 2) The cells that we are moving into are empty
				// 3) The cells that we are moving into are occupied by the original image or the overflow of the original image
				for ( var xi=x; validMove && xi<x+image.w; ++xi ) {
					for ( var yi=y; validMove && yi<y+image.h; ++yi ) {

						// are we within the grid?
						if ( xi >= 0 && xi < this.numOfColumns && yi >= 0 && yi < this.numOfRows ) {
							var cellImage = this.model.getCell( xi, yi );

							if ( cellImage.status == 'filled' ) {
								// If this filled cell is the original cell, then it is valid, otherwise, false
								validMove = xi == image.x && yi == image.y;

							} else if ( cellImage.status == 'filled-overflow' ) {
								// If this filled-overflow is for the original cell, then it is valid, otherwise, false
								validMove = cellImage.origin.x == image.x && cellImage.origin.y == image.y;

							} else if ( cellImage.status != 'empty' ) {
								// If not empty, then false
								validMove = false;
							}
						} else {
							// outside the grid, then false
							validMove = false;
						}
					}
				}

				if ( validMove ) {
					var imageData = image.image; // Need to keep because Backbone deletes the image object
					var w = image.w;
					var h = image.h;
					this.model.setCell( image.x, image.y, 1, 1, 'empty' );
					this.model.setCell( x, y, w, h, 'filled', imageData );

					// Clear out dragging styles
					this.clearMoveDragStyles( this._dragMove.cell );

					var newCell = this.$el.find( '.acf-image-grid-cell[data-x="'+x+'"][data-y="'+y+'"]' );
					var outline = newCell.find( '.outline' );

					// Update the startX and startY to keep the same distance relationship with the new element
					var offset = this.$el.offset();
					var cellOffset = this._dragMove.cell.offset();
					var newCellOffset = newCell.offset();
					var startX = this._dragMove.startX + (x*cellDim) - (this._dragMove.x*cellDim);
					var startY = this._dragMove.startY + (y*cellDim) - (this._dragMove.y*cellDim);

					this._dragMove = { x: x, y: y, cell: newCell, outline: outline, startX: startX, startY: startY };

					newCell.addClass( 'moving' );
					outline.width( outline.width() );
					outline.height( outline.height() );
					outline.css( {
						'top': event.pageY - this._dragMove.startY,
						'left': event.pageX - this._dragMove.startX,
						right: 'auto',
						bottom: 'auto'
					} );
					
				}
			}
		},

		/**
		 * Handle the event callback for dragend
		 *
		 * @param Event event
		 */
		onDragEnd: function( event ) {
			switch( this._dragType ) {
				case 'handle':
					return this.onHandleDragEnd( event );

				case 'move':
					return this.onMoveDragEnd( event );
			}
		},


		/**
		 * Handle the dragend event for handle (resizing)
		 */
		onHandleDragEnd: function( event ) {
			this.clearHandleDragStyles( this._dragHandle.cell );
			this.model.save();
		},

		/**
		 * Removes the styling needed on a cell for resizing
		 */
		clearHandleDragStyles: function( cell ) {
			cell.removeClass( 'resizing' );
			cell.find('.outline').css( { top: '', left: '', right: '', bottom: '' } );
		},


		/**
		 * Handle the dragend event for moving
		 */
		onMoveDragEnd: function( event ) {
			this.clearMoveDragStyles( this._dragMove.cell );
			this.model.save();
		},

		/**
		 * Removes the styles needed on a cell for moving
		 */
		clearMoveDragStyles: function( cell ) {
			cell.removeClass( 'moving' );
			cell.find('.outline').css( { top: '', left: '', right: '', bottom: '', height: '', width: '' });
		},


	} );


	/**
	 * Call this to create the UI for selecting locked cells
	 */
	acfImageGrid.createlUi = function( widget ) {
		var view = new InputUiView( { el: $(widget) } );
		view.attach();
	};
} )( jQuery );