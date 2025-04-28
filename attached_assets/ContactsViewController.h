//
//  ContactsViewController.h
//  Bees Chest
//
//  Created by Billy Irwin on 1/1/14.
//  Copyright (c) 2014 Arbrr. All rights reserved.
//


//The apps main view
//Responsible for rendering all of the contacts and searching/filtering


#import <UIKit/UIKit.h>
#import "ContactViewController.h"
#import <SDWebImage/UIImageView+WebCache.h>
#import "BATypeAheadViewController.h"
#import "BeeButton.h"
#import <FontAwesomeKit/FAKIonIcons.h>

@interface ContactsViewController : BaseViewController <UITableViewDataSource, UITableViewDelegate, UISearchBarDelegate, UIActionSheetDelegate, BATypeAheadDelegate, UICollectionViewDataSource, UICollectionViewDelegate, UICollectionViewDelegateFlowLayout>
@property (weak, nonatomic) IBOutlet UISegmentedControl *segmentedControl;
@property (strong, nonatomic) IBOutlet UIButton *networkButton;

@property (weak, nonatomic) IBOutlet UITableView *ContactTableView;
@property (weak, nonatomic) IBOutlet UISearchBar *searchBar;
@property (strong, nonatomic) IBOutlet BeeButton *beeButton;

@property (strong, nonatomic) IBOutlet UIView *tagFilterView;
@property (strong, nonatomic) BATypeAheadViewController *typeAheadViewController;

@property (strong, nonatomic) IBOutlet UITableView *tagTableView;
@property (strong, nonatomic) NSMutableArray *tagFilters;

//filter contacts by preset tags
- (IBAction)filterTags:(id)sender;

//choose a new tag to filter by
- (IBAction)newTag:(id)sender;

@end
